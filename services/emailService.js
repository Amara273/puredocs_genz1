const nodemailer = require('nodemailer');

// ── Create transporter ────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,  
  },
});

const APP_NAME = process.env.APP_NAME || 'PureDocs GENZ1';
const APP_URL  = process.env.APP_URL  || 'http://localhost:5000';

// ── Shared email template wrapper ────────────────────
function wrapTemplate(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="km">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;}
    .wrap{max-width:560px;margin:40px auto;background:#182040;border-radius:16px;overflow:hidden;border:1px solid #2a3a6a;}
    .header{background:linear-gradient(135deg,#4f8ef7,#38d9a9);padding:28px 32px;text-align:center;}
    .header h1{color:#fff;font-size:22px;margin:0;font-weight:700;}
    .header p{color:rgba(255,255,255,.85);font-size:13px;margin:6px 0 0;}
    .body{padding:32px;}
    .body p{color:#9aacce;font-size:14px;line-height:1.7;margin:0 0 16px;}
    .body strong{color:#e8eeff;}
    .btn{display:inline-block;background:linear-gradient(135deg,#4f8ef7,#3a78e8);color:#fff!important;
      text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;
      margin:8px 0 20px;letter-spacing:.3px;}
    .code{background:#0f1629;border:1px solid #2a3a6a;border-radius:10px;padding:16px 20px;
      font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#4f8ef7;
      text-align:center;letter-spacing:4px;margin:16px 0;}
    .note{background:rgba(79,142,247,.08);border:1px solid rgba(79,142,247,.2);border-radius:10px;
      padding:14px 16px;font-size:12px;color:#5a6f9a;margin-top:16px;}
    .footer{padding:20px 32px;border-top:1px solid #2a3a6a;text-align:center;}
    .footer p{color:#5a6f9a;font-size:12px;margin:0;}
  </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>${APP_NAME}</h1>
        <p>Collaborative Document Management</p>
      </div>
      <div class="body">
        <h2 style="color:#e8eeff;font-size:18px;margin:0 0 16px">${title}</h2>
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>${APP_NAME} · ${APP_URL}</p>
        <p style="margin-top:6px">អ៊ីមែលនេះបានផ្ញើដោយស្វ័យប្រវត្តិ — សូមមិនត្រូវឆ្លើយតប</p>
      </div>
    </div>
  </body>
  </html>`;
}

// ── Send helper ───────────────────────────────────────
async function sendMail(to, subject, html) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail not configured — skipping email to:', to);
    console.warn('   Subject:', subject);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });
    console.log('📧 Email sent to:', to);
    return true;
  } catch(err) {
    console.error('❌ Email failed:', err.message);
    return false;
  }
}

// ══════════════════════════════════════════════════════
// 1. EMAIL VERIFICATION  (sent on register)
// ══════════════════════════════════════════════════════
async function sendVerificationEmail(user, verifyToken) {
  const link = `${APP_URL}/api/auth/verify-email/${verifyToken}`;
  const html = wrapTemplate('✅ បញ្ជាក់អ៊ីមែលរបស់អ្នក', `
    <p>សួស្ដី <strong>${user.name}</strong>,</p>
    <p>អរគុណដែលបានចុះឈ្មោះប្រើ <strong>${APP_NAME}</strong>។ 
    សូមចុចប៊ូតុងខាងក្រោម ដើម្បីបញ្ជាក់អ៊ីមែលរបស់អ្នក។</p>
    <div style="text-align:center">
      <a href="${link}" class="btn">✅ បញ្ជាក់អ៊ីមែល</a>
    </div>
    <div class="note">⏰ តំណភ្ជាប់នេះផុតកំណត់ក្នុង <strong>24 ម៉ោង</strong>។<br>
    បើអ្នកមិនបានចុះឈ្មោះ — អាចមិនអើពើអ៊ីមែលនេះ។</div>
  `);
  return sendMail(user.email, `[${APP_NAME}] បញ្ជាក់អ៊ីមែលរបស់អ្នក`, html);
}

// ══════════════════════════════════════════════════════
// 2. FORGOT PASSWORD
// ══════════════════════════════════════════════════════
async function sendPasswordResetEmail(user, resetToken) {
  const link = `${APP_URL}/reset-password?token=${resetToken}`;
  const html = wrapTemplate('🔑 កំណត់ពាក្យសម្ងាត់ឡើងវិញ', `
    <p>សួស្ដី <strong>${user.name}</strong>,</p>
    <p>យើងទទួលបានសំណើកំណត់ពាក្យសម្ងាត់ឡើងវិញសម្រាប់គណនី 
    <strong>${user.email}</strong>។</p>
    <div style="text-align:center">
      <a href="${link}" class="btn">🔑 កំណត់ពាក្យសម្ងាត់ថ្មី</a>
    </div>
    <div class="note">
      ⏰ តំណភ្ជាប់នេះផុតកំណត់ក្នុង <strong>1 ម៉ោង</strong>។<br>
      🔒 បើអ្នកមិនបានស្នើ — ពាក្យសម្ងាត់របស់អ្នកនៅសុវត្ថិភាព អាចមិនអើពើ។
    </div>
  `);
  return sendMail(user.email, `[${APP_NAME}] កំណត់ពាក្យសម្ងាត់ឡើងវិញ`, html);
}

// ══════════════════════════════════════════════════════
// 3. ADMIN APPROVAL REQUEST  (sent to all admins)
// ══════════════════════════════════════════════════════
async function sendApprovalRequestEmail(adminEmail, adminName, newUser) {
  const approveLink = `${APP_URL}/api/auth/approve/${newUser.id}?action=approve`;
  const rejectLink  = `${APP_URL}/api/auth/approve/${newUser.id}?action=reject`;
  const html = wrapTemplate('👤 សំណើចូលប្រើថ្មី — តម្រូវការអនុម័ត', `
    <p>សួស្ដី <strong>${adminName}</strong>,</p>
    <p>អ្នកប្រើថ្មីបានស្នើចូលប្រើ <strong>${APP_NAME}</strong> 
    ហើយទាមទារការអនុម័តពីអ្នក។</p>
    <div style="background:#0f1629;border:1px solid #2a3a6a;border-radius:10px;padding:16px 20px;margin:16px 0">
      <p style="margin:0 0 6px"><strong>ឈ្មោះ:</strong> ${newUser.name}</p>
      <p style="margin:0 0 6px"><strong>អ៊ីមែល:</strong> ${newUser.email}</p>
      <p style="margin:0"><strong>ពេលវេលា:</strong> ${new Date().toLocaleString('km-KH')}</p>
    </div>
    <div style="display:flex;gap:12px;margin-top:20px">
      <a href="${approveLink}" style="flex:1;display:block;text-align:center;background:linear-gradient(135deg,#38d9a9,#2ab890);color:#fff;text-decoration:none;padding:12px;border-radius:10px;font-weight:700">✅ អនុម័ត</a>
      <a href="${rejectLink}" style="flex:1;display:block;text-align:center;background:rgba(255,107,107,.2);border:1px solid rgba(255,107,107,.4);color:#ff6b6b;text-decoration:none;padding:12px;border-radius:10px;font-weight:700">❌ បដិសេធ</a>
    </div>
  `);
  return sendMail(adminEmail, `[${APP_NAME}] សំណើចូលប្រើថ្មី — ${newUser.name}`, html);
}

// ══════════════════════════════════════════════════════
// 4. ACCOUNT APPROVED  (sent to user)
// ══════════════════════════════════════════════════════
async function sendAccountApprovedEmail(user) {
  const html = wrapTemplate('🎉 គណនីរបស់អ្នកត្រូវបានអនុម័ត!', `
    <p>សួស្ដី <strong>${user.name}</strong>,</p>
    <p>🎉 អ្នកគ្រប់គ្រងបានអនុម័តគណនីរបស់អ្នករួចហើយ! 
    ឥឡូវអ្នកអាចចូលប្រើ <strong>${APP_NAME}</strong> បានហើយ។</p>
    <div style="text-align:center;margin:20px 0">
      <a href="${APP_URL}" class="btn">🚀 ចូលប្រើឥឡូវ</a>
    </div>
    <p>ប្រសិនបើអ្នកមានបញ្ហា សូមទំនាក់ទំនងអ្នកគ្រប់គ្រងក្រុម។</p>
  `);
  return sendMail(user.email, `[${APP_NAME}] 🎉 គណនីរបស់អ្នកត្រូវបានអនុម័ត`, html);
}

// ══════════════════════════════════════════════════════
// 5. ACCOUNT REJECTED  (sent to user)
// ══════════════════════════════════════════════════════
async function sendAccountRejectedEmail(user) {
  const html = wrapTemplate('❌ សំណើចូលប្រើត្រូវបានបដិសេធ', `
    <p>សួស្ដី <strong>${user.name}</strong>,</p>
    <p>យើងសូមជម្រាបថាសំណើចូលប្រើរបស់អ្នកសម្រាប់ <strong>${APP_NAME}</strong> 
    មិនត្រូវបានអនុម័ត។</p>
    <p>បើអ្នកគិតថានេះជាកំហុស សូមទំនាក់ទំនងអ្នកគ្រប់គ្រងក្រុមដោយផ្ទាល់។</p>
  `);
  return sendMail(user.email, `[${APP_NAME}] សំណើចូលប្រើរបស់អ្នក`, html);
}

// ══════════════════════════════════════════════════════
// 6. TEAM INVITATION
// ══════════════════════════════════════════════════════
async function sendInvitationEmail(toEmail, inviterName, teamName, inviteToken) {
  const link = `${APP_URL}/join?token=${inviteToken}`;
  const html = wrapTemplate('📨 អ្នកត្រូវបានអញ្ជើញចូលក្រុម', `
    <p><strong>${inviterName}</strong> បានអញ្ជើញអ្នកចូលក្រុម 
    <strong>${teamName}</strong> នៅ <strong>${APP_NAME}</strong>។</p>
    <div style="text-align:center;margin:20px 0">
      <a href="${link}" class="btn">✅ ទទួលយកការអញ្ជើញ</a>
    </div>
    <div class="note">
      ⏰ ការអញ្ជើញនេះផុតកំណត់ក្នុង <strong>7 ថ្ងៃ</strong>។<br>
      បើអ្នកមិនស្គាល់ <strong>${inviterName}</strong> — អាចមិនអើពើ។
    </div>
  `);
  return sendMail(toEmail, `[${APP_NAME}] ${inviterName} អញ្ជើញអ្នកចូល ${teamName}`, html);
}

// ══════════════════════════════════════════════════════
// 7. PASSWORD CHANGED NOTICE
// ══════════════════════════════════════════════════════
async function sendPasswordChangedEmail(user) {
  const html = wrapTemplate('🔒 ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរ', `
    <p>សួស្ដី <strong>${user.name}</strong>,</p>
    <p>ពាក្យសម្ងាត់គណនី <strong>${user.email}</strong> 
    ត្រូវបានផ្លាស់ប្ដូររួចហើយ។</p>
    <p>ប្រសិនបើអ្នកមិនបានធ្វើការផ្លាស់ប្ដូរនេះ 
    <strong style="color:#ff6b6b">សូមទំនាក់ទំនងអ្នកគ្រប់គ្រងភ្លាម!</strong></p>
    <div class="note">🔐 ដើម្បីសុវត្ថិភាព — កុំចែករំលែកពាក្យសម្ងាត់ជាមួយអ្នកណា។</div>
  `);
  return sendMail(user.email, `[${APP_NAME}] 🔒 ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្ដូរ`, html);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApprovalRequestEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendInvitationEmail,
  sendPasswordChangedEmail,
};