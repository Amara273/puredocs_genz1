// ════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════
const API_BASE = window.location.hostname === 'puredocs-genz1'
  ? 'http://localhost:5000/api' 
  : 'https://puredocs-genz1.onrender.com/api';

// ── API helper ──────────────────────────────────────────
async function api(method, path, body = null, isForm = false) {
  const token = localStorage.getItem('tdkh_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!isForm && body) headers['Content-Type'] = 'application/json';
  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok && !data.success) throw new Error(data.message || 'Request failed');
  return data;
}

async function fetchBlob(path) {
  const token = localStorage.getItem('tdkh_token');
  const res = await fetch(API_BASE + path, { headers: { 'Authorization': 'Bearer ' + token } });
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

// ════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════
const state = {
  currentUser: null, teams: [], files: [],
  currentTeamId: null, selectedFiles: new Set(), currentPage: 'dashboard'
};
let currentFolderId = null;
let currentFolderBreadcrumb = [];
let currentViewFile = null;

const COLORS = [
  'linear-gradient(135deg,#4f8ef7,#38d9a9)',
  'linear-gradient(135deg,#f5c842,#ff8c42)',
  'linear-gradient(135deg,#b46fff,#4f8ef7)',
  'linear-gradient(135deg,#ff6b6b,#ffa07a)',
  'linear-gradient(135deg,#38d9a9,#4fc3f7)',
  'linear-gradient(135deg,#f5c842,#e879a0)',
];

const FILE_ICONS = {
  pdf:  'images/pdf-icon.png',
  doc:  'images/docs-icon.png',
  docx: 'images/docs-icon.png',
  xls:  'images/xlsx-icon.png',
  xlsx: 'images/xlxs-icon.png',
  csv:  'images/csv.png',
  ppt:  'images/ppt.png',
  pptx: 'images/ppt.png',
  png:  'images/gallert.png',
  jpg:  'images/gallert.png',
  jpeg: 'images/gallert.png',
  gif:  'images/gallert.png',
  webp: 'images/img.png',
  svg:  'images/img.png',
  zip:  'images/zip.png',
  rar:  'images/zip.png',
  txt:  'images/txt.png',
  mp4:  'images/mp4.png',
  mp3:  'images/mp3.png',
  wav:  'images/mp3.png',
};

function getFileType(name) {
  const e = (name||'').split('.').pop().toLowerCase();
  if (e==='pdf') return 'pdf';
  if (['doc','docx','txt','md'].includes(e)) return 'doc';
  if (['xls','xlsx','csv'].includes(e)) return 'xls';
  if (['png','jpg','jpeg','gif','webp','svg'].includes(e)) return 'img';
  if (['zip','rar','7z'].includes(e)) return 'zip';
  return 'other';
}
function getFileIcon(name) {
  const src = FILE_ICONS[(name||'').split('.').pop().toLowerCase()] || 'images/file.png';
  return `<img src="${src}" width="32" height="32" style="object-fit:contain" />`;
}
function formatSize(b) {
  if (!b) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(1) + ' MB';
}
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date(), diff = (now-d)/1000;
  if (diff < 60) return 'ឥឡូវនេះ';
  if (diff < 3600) return Math.floor(diff/60) + ' នាទីមុន';
  if (diff < 86400) return Math.floor(diff/3600) + ' ម៉ោងមុន';
  if (diff < 604800) return Math.floor(diff/86400) + ' ថ្ងៃមុន';
  return d.toLocaleDateString('km-KH');
}
function getInitials(name) { return (name||'?').charAt(0).toUpperCase(); }
function $id(id) { return document.getElementById(id); }
function setText(id, val) { const e=$id(id); if(e) e.textContent=val; }
function normalizeFile(f) {
  return {
    id: f.id, name: f.original_name||f.name,
    size: f.size, teamId: f.team_id||f.teamId,
    folderId: f.folder_id||f.folderId||null,
    folderName: f.folder_name||'',
    uploaderId: f.uploader_id||f.uploaderId,
    uploaderName: f.uploader_name||'',
    uploadedAt: f.upload_date ? new Date(f.upload_date).getTime() : (f.uploadedAt||Date.now()),
    shared: !!f.is_shared, shareToken: f.share_token||null,
    mimetype: f.mimetype||'',
  };
}

// ════════════════════════════════════════════════════════
// TOKEN
// ════════════════════════════════════════════════════════
function saveToken(t) { localStorage.setItem('tdkh_token', t); }
function clearToken()  { localStorage.removeItem('tdkh_token'); }
function getToken()    { return localStorage.getItem('tdkh_token'); }

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════
// ── Auth screen switcher ──────────────────────────────
function showAuthScreen(screen) {
  ['screenLogin','screenForgot','screenReset','screenPending','screenVerified']
    .forEach(s => { const e=$id(s); if(e) e.style.display='none'; });
  const el=$id('screen'+screen.charAt(0).toUpperCase()+screen.slice(1));
  if(el) el.style.display='block';
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register')));
  $id('loginForm').style.display    = tab==='login'    ? 'block' : 'none';
  $id('registerForm').style.display = tab==='register' ? 'block' : 'none';
}

// Load registration mode from server and show hint
async function loadAuthStatus() {
  try {
    const d = await api('GET','/auth/status');
    const modeHints = {
      open:        '* ចុះឈ្មោះហើយចូលប្រើបានភ្លាម',
      approval:    '* ត្រូវការការអនុម័តពី Admin មុនចូលប្រើ',
      invite_only: '* ត្រូវការការអញ្ជើញពី Admin ទើបចុះឈ្មោះបាន',
    };
    const note = $id('regModeNote');
    if(note) note.textContent = modeHints[d.mode] || '';
    if(d.mode === 'invite_only') {
      const tab = document.querySelector('.auth-tab:last-child');
      if(tab){ tab.disabled=true; tab.style.opacity='.4'; tab.title='Invite only'; }
    }
  } catch(_){}
}

// ── LOGIN ─────────────────────────────────────────────
async function doLogin() {
  const email=$id('loginEmail').value.trim(), pass=$id('loginPass').value;
  if (!email||!pass) { toast('សូមបំពេញ Email និង Password','error'); return; }
  setLoading('loginBtn',true,'កំពុងចូល...');
  try {
    const d = await api('POST','/auth/login',{email,password:pass});
    saveToken(d.token);
    loginSuccess(d.user, d.teams||[]);
  } catch(e) {
    // pending account
    if(e.message && (e.message.includes('pending')||e.message.includes('approval'))) {
      showAuthScreen('pending');
    } else {
      toast(e.message,'error');
    }
  }
  finally { setLoading('loginBtn',false,'ចូលប្រើប្រាស់'); }
}

// ── REGISTER ──────────────────────────────────────────
async function doRegister() {
  const name=$id('regName').value.trim(), email=$id('regEmail').value.trim(),
        pass=$id('regPass').value, teamCode=$id('regTeam').value.trim();
  if (!name||!email||!pass) { toast('សូមបំពេញគ្រប់ព័ត៌មាន','error'); return; }
  if (pass.length < 6) { toast('ពាក្យសម្ងាត់យ៉ាងតិច 6 តួ','error'); return; }
  setLoading('registerBtn',true,'កំពុងចុះឈ្មោះ...');
  try {
    const d = await api('POST','/auth/register',{name,email,password:pass,teamCode});
    if (d.pending) {
      // approval mode — show pending screen
      showAuthScreen('pending');
      toast('ចុះឈ្មោះជោគជ័យ! រង់ចាំ Admin អនុម័ត','success');
    } else {
      saveToken(d.token);
      loginSuccess(d.user, d.team?[d.team]:[]);
      toast('ចុះឈ្មោះជោគជ័យ! ','success');
    }
  } catch(e) { toast(e.message,'error'); }
  finally { setLoading('registerBtn',false,'ចុះឈ្មោះចូលក្រុម'); }
}

// ── FORGOT PASSWORD ───────────────────────────────────
async function doForgotPassword() {
  const email=$id('forgotEmail').value.trim();
  if(!email){ toast('សូមបញ្ចូល Email','error'); return; }
  setLoading('forgotBtn',true,'កំពុងផ្ញើ...');
  try {
    await api('POST','/auth/forgot-password',{email});
    toast('Email reset ត្រូវបានផ្ញើ (បើ Email នេះមាន)','success');
    $id('forgotEmail').value='';
    showAuthScreen('login');
  } catch(e){ toast(e.message,'error'); }
  finally { setLoading('forgotBtn',false,'📧 ផ្ញើ Reset Link'); }
}

// ── RESET PASSWORD (from URL token) ──────────────────
async function initResetPage(token) {
  if(!token) return;
  try {
    const d = await api('GET','/auth/reset-password/'+token);
    $id('resetToken').value = token;
    $id('resetEmailLabel').textContent = d.email||'';
    showAuthScreen('reset');
    $id('authScreen').style.display='flex';
    $id('app').style.display='none';
  } catch(e){
    toast('Reset link ផុតកំណត់ ឬ មិនត្រឹមត្រូវ','error');
    showAuthScreen('login');
  }
}

async function doResetPassword() {
  const token=$id('resetToken').value;
  const pass=$id('newPassword').value;
  const confirm=$id('confirmPassword').value;
  if(!pass||!confirm){ toast('សូមបំពេញពាក្យសម្ងាត់','error'); return; }
  if(pass.length<6){ toast('ពាក្យសម្ងាត់យ៉ាងតិច 6 តួ','error'); return; }
  if(pass!==confirm){ toast('ពាក្យសម្ងាត់មិនដូចគ្នា','error'); return; }
  setLoading('resetBtn',true,'កំពុងផ្លាស់ប្ដូរ...');
  try {
    const d = await api('POST','/auth/reset-password',{token,password:pass});
    toast(d.message,'success');
    showAuthScreen('login');
    $id('loginEmail').value='';
  } catch(e){ toast(e.message,'error'); }
  finally { setLoading('resetBtn',false,'🔒 កំណត់ពាក្យសម្ងាត់'); }
}

// ── ACCEPT INVITE (from URL) ──────────────────────────
async function acceptInviteFromUrl(inviteToken) {
  if(!getToken()){ 
    // Not logged in — show register with note
    showAuthScreen('login');
    toast('សូមចូល ឬ ចុះឈ្មោះ ដើម្បីទទួលយកការអញ្ជើញ','info');
    localStorage.setItem('pendingInviteToken', inviteToken);
    return;
  }
  try {
    const d = await api('POST','/teams/accept-invite/'+inviteToken);
    toast('<img src="images/success.png" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> '+d.message,'success');
    localStorage.removeItem('pendingInviteToken');
    window.history.replaceState({},'','/');
    const meData = await api('GET','/auth/me');
    loginSuccess(meData.user, meData.teams||[]);
  } catch(e){ toast(e.message,'error'); }
}

function loginSuccess(user, teams=[]) {
  state.currentUser = user;
  state.teams = Array.isArray(teams) ? teams : (teams ? [teams] : []);
  state.currentTeamId = state.teams.length > 0 ? state.teams[0].id : null;
  $id('authScreen').style.display = 'none';
  $id('app').style.display = 'block';
  updateSidebarUser(); updateSidebarTeam();
  renderDashboard();
  toast('សូមស្វាគមន៍, ' + user.name + '!','success');

  // Show admin nav if admin
  const adminNav=$id('adminNavItem');
  if(adminNav) adminNav.style.display = user.role==='admin' ? 'flex' : 'none';

  // Load pending count for admin badge
  if(user.role==='admin') loadPendingCount();

  // Accept pending invite if any
  const pendingInvite = localStorage.getItem('pendingInviteToken');
  if(pendingInvite) acceptInviteFromUrl(pendingInvite);
}

function doLogout() {
  clearToken();
  state.currentUser=null; state.teams=[]; state.files=[]; state.currentTeamId=null;
  currentFolderId=null; currentFolderBreadcrumb=[];
  $id('authScreen').style.display='flex';
  $id('app').style.display='none';
  showAuthScreen('login');
  clearSelection();
}

async function checkSession() {
  const params = new URLSearchParams(window.location.search);

  // Handle reset password link
  if(params.get('token') && window.location.pathname.includes('reset')) {
    $id('authScreen').style.display='flex';
    await initResetPage(params.get('token'));
    return;
  }

  // Handle invite link (/join?token=xxx)
  if(window.location.pathname.includes('/join') && params.get('token')) {
    $id('authScreen').style.display='flex';
    await acceptInviteFromUrl(params.get('token'));
    return;
  }

  // Handle email verified redirect
  if(params.get('verified')==='1') {
    $id('authScreen').style.display='flex';
    showAuthScreen('verified');
    return;
  }

  // Normal session check
  if (!getToken()) {
    $id('authScreen').style.display='flex';
    loadAuthStatus();
    return;
  }
  try {
    const d = await api('GET','/auth/me');
    loginSuccess(d.user, d.teams||[]);
  } catch(e) {
    clearToken();
    $id('authScreen').style.display='flex';
    loadAuthStatus();
  }
}

function setLoading(id, on, label) {
  const b=$id(id); if(b){b.disabled=on;b.textContent=label;}
}

// ════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=$id('page'+name.charAt(0).toUpperCase()+name.slice(1));
  if(el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const map={dashboard:0,files:1,shared:2,mine:3,upload:4,activity:5,members:6,settings:7,admin:8};
  const items=document.querySelectorAll('.nav-item');
  if(map[name]!==undefined && items[map[name]]) items[map[name]].classList.add('active');
  state.currentPage=name; closeSidebar();
  if (name==='files')          renderFilesPage(currentFolderId);
  else if (name==='shared')    renderSharedPage();
  else if (name==='mine')      renderMinePage();
  else if (name==='members')   renderMembersPage();
  else if (name==='dashboard') renderDashboard();
  else if (name==='activity')  renderActivityPage();
  else if (name==='settings')  loadSettingsPage();
  else if (name==='upload')    updateUploadLabel();
  else if (name==='admin')     renderAdminPage();
}

function renderCurrentPage() {
  const n=state.currentPage;
  if (n==='files')         renderFilesPage(currentFolderId);
  else if (n==='shared')   renderSharedPage();
  else if (n==='mine')     renderMinePage();
  else if (n==='dashboard') renderDashboard();
  else if (n==='activity') renderActivityPage();
}

// ════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════
function updateSidebarUser() {
  const u=state.currentUser; if(!u) return;
  const av=$id('sidebarAvatar');
  av.textContent=getInitials(u.name);
  av.style.background=u.avatar_color||u.color||COLORS[0];
  setText('sidebarName',u.name);
  setText('sidebarRole',u.role||'Member');
}
function updateSidebarTeam() {
  const t=state.teams.find(x=>x.id===state.currentTeamId); if(!t) return;
  setText('sidebarTeamName',t.name);
  setText('sidebarTeamCount',(t.member_count||t.members?.length||'?')+' នាក់');
  const av=$id('sidebarTeamAvatar');
  av.textContent=getInitials(t.name);
  av.style.background=t.color||COLORS[0];
}
function toggleSidebar() { $id('sidebar').classList.toggle('open'); $id('overlayBg').classList.toggle('show'); }
function closeSidebar()   { $id('sidebar').classList.remove('open'); $id('overlayBg').classList.remove('show'); }

// ════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════
async function loadFolderContents(folderId) {
  if (!state.currentTeamId) return {folders:[],files:[],breadcrumb:[]};
  const q = '/folders?teamId='+state.currentTeamId+(folderId?'&parentId='+folderId:'');
  const d = await api('GET',q);
  state.files = (d.files||[]).map(normalizeFile);
  updateBadge(); return d;
}

async function loadAllFiles() {
  if (!state.currentTeamId) return;
  try {
    const d = await api('GET','/files?teamId='+state.currentTeamId);
    state.files=(d.files||[]).map(normalizeFile); updateBadge();
  } catch(e) { console.error(e.message); }
}

function updateBadge() { setText('navBadgeFiles', state.files.length); }
function updateUploadLabel() {
  const lbl=$id('uploadTargetLabel'); if(!lbl) return;
  lbl.textContent = (currentFolderId && currentFolderBreadcrumb.length)
    ? currentFolderBreadcrumb[currentFolderBreadcrumb.length-1].name : 'Home';
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
async function renderDashboard() {
  await loadAllFiles();
  const files=state.files, shared=files.filter(f=>f.shared), mine=files.filter(f=>f.uploaderId===state.currentUser?.id);
  const team=state.teams.find(t=>t.id===state.currentTeamId);
  setText('statTotal',files.length); setText('statShared',shared.length); setText('statMine',mine.length);
  try { const m=await api('GET','/teams/'+state.currentTeamId+'/members'); setText('statMembers',(m.members||[]).length); } catch(_){}
  setText('dashWelcome',(state.currentUser?.name||'')+' | '+(team?.name||'')+' · '+new Date().toLocaleDateString('km-KH'));
  renderFilesGrid('recentFilesGrid',[...files].sort((a,b)=>b.uploadedAt-a.uploadedAt).slice(0,6),true);
}

// ════════════════════════════════════════════════════════
// FILES + FOLDERS PAGE
// ════════════════════════════════════════════════════════
async function renderFilesPage(folderId) {
  currentFolderId = (folderId===undefined||folderId===null) ? null : folderId;
  try {
    const d = await loadFolderContents(currentFolderId);
    currentFolderBreadcrumb = d.breadcrumb||[];
    renderBreadcrumb(currentFolderBreadcrumb);
    renderFoldersGrid(d.folders||[]);
    filterFiles();
  } catch(e) { toast('Error: '+e.message,'error'); }
}
 
function renderBreadcrumb(crumbs) {
  const el=$id('breadcrumb'); if(!el) return;
  const parts=[{id:null,name:'Home'},...crumbs];
  el.innerHTML = parts.map((c,i)=>{
    const last=i===parts.length-1;
    const oc=last?'':`onclick="navigateToFolder(${c.id?'"'+c.id+'"':'null'})"`;
    return (i?'<span class="bc-sep">›</span>':'')+'<span class="bc-item'+(last?' active':'')+'" '+oc+'>'+c.name+'</span>';
  }).join('');
}
 
function navigateToFolder(id) { renderFilesPage(id); }
 
function renderFoldersGrid(folders) {
  const el=$id('foldersGrid'); if(!el) return;
  if (!folders.length) { el.innerHTML=''; return; }
  el.innerHTML = folders.map(f=>{
    const sn=f.name.replace(/'/g,"\\'");
    return '<div class="folder-card" ondblclick="navigateToFolder(\''+f.id+'\')">'
      +'<span class="folder-icon"><img src="https://img.icons8.com/?size=100&id=dINnkNb1FBl4&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;"/></span>'
      +'<div class="folder-info">'
        +'<div class="fname">'+f.name+'</div>'
        +'<div class="fmeta">'+(f.subfolder_count||0)+' ថត · '+(f.file_count||0)+' ឯកសារ</div>'
        +'<div class="fmeta">by '+(f.creator_name||'?')+' · '+formatDate(new Date(f.created_at).getTime())+'</div>'
      +'</div>'
      +'<div class="folder-actions">'
        +'<button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();openRenameFolder(\''+f.id+'\',\''+sn+'\')" title="Rename"><img src="https://img.icons8.com/?size=100&id=12082&format=png&color=000000" width="18" height="18" style="object-fit:contain;vertical-align:middle;"/></button>'
        +'<button class="btn btn-green btn-sm btn-icon" onclick="event.stopPropagation();downloadFolder(\''+f.id+'\',\''+sn+'\')" title="ZIP"><img src="https://img.icons8.com/?size=100&id=ru2MhpaRwUwk&format=png&color=000000" width="18" height="18" style="object-fit:contain;vertical-align:middle;"/></button>'
        +'<button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteFolder(\''+f.id+'\',\''+sn+'\')" title="Delete"><img src="https://img.icons8.com/?size=100&id=102350&format=png&color=000000" width="18" height="18" style="object-fit:contain;vertical-align:middle;"/></button>'
      +'</div>'
    +'</div>';
  }).join('');
}
 
function filterFiles() {
  let files=[...state.files];
  const s=($id('searchFiles')?.value||'').toLowerCase();
  const t=$id('filterType')?.value||'';
  const so=$id('filterSort')?.value||'newest';
  if(s) files=files.filter(f=>f.name.toLowerCase().includes(s));
  if(t) files=files.filter(f=>getFileType(f.name)===t);
  if(so==='newest') files.sort((a,b)=>b.uploadedAt-a.uploadedAt);
  else if(so==='oldest') files.sort((a,b)=>a.uploadedAt-b.uploadedAt);
  else if(so==='name') files.sort((a,b)=>a.name.localeCompare(b.name));
  else if(so==='size') files.sort((a,b)=>b.size-a.size);
  renderFilesGrid('allFilesGrid',files,true);
}
 
async function renderSharedPage() {
  await loadAllFiles();
  renderFilesGrid('sharedFilesGrid',state.files.filter(f=>f.shared),false);
}
async function renderMinePage() {
  await loadAllFiles();
  renderFilesGrid('myFilesGrid',state.files.filter(f=>f.uploaderId===state.currentUser?.id),false);
}

// ════════════════════════════════════════════════════════
// RENDER FILE CARDS
// ════════════════════════════════════════════════════════
function renderFilesGrid(containerId, files, showTags) {
  const c=$id(containerId); if(!c) return;
  if (!files.length) {
    c.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="ei"><img src="https://img.icons8.com/?size=100&id=zJCy9v3GWPKd&format=png&color=000000" width="64" height="64" style="object-fit:contain;vertical-align:middle;margin-right:1px"/></div><h3>មិនមានឯកសារ</h3><p>ចុច Upload ដើម្បីចាប់ផ្តើម</p></div>';
    return;
  }
  c.innerHTML = files.map(file=>{
    const type=getFileType(file.name), icon=getFileIcon(file.name);
    const sel=state.selectedFiles.has(file.id);
    const isNew=(Date.now()-file.uploadedAt)<3600000;
    const isMine=file.uploaderId===state.currentUser?.id;
    const tags=showTags?`
   
    `:'';
    return `<div class="file-card ${sel?'selected':''}" id="fc-${file.id}" onclick="toggleFileSel('${file.id}')">
      <div class="sel-chk">✓</div>
      <div class="file-icon-wrap ${type}" onclick="event.stopPropagation();viewFileById('${file.id}')">${icon}</div>
      <div class="file-name" onclick="event.stopPropagation();viewFileById('${file.id}')" title="${file.name}">${file.name}</div>
      <div class="file-meta">
        <span>${formatSize(file.size)}</span><span>·</span><span>${formatDate(file.uploadedAt)}</span>
        ${file.uploaderName?`<span>·</span><span style="color:var(--accent3)">${file.uploaderName}</span>`:''}
      </div>
      ${tags}
      <div class="file-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="viewFileById('${file.id}')" title="មើល"><img src="https://img.icons8.com/?size=100&id=38869&format=png&color=000000" width="16" height="16" style="object-fit:contain;vertical-align:middle;"/></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="downloadFile('${file.id}')" title="Download"><img src="https://img.icons8.com/?size=100&id=VGQlJM067vkN&format=png&color=000000" width="16" height="16" style="object-fit:contain;vertical-align:middle;"/></button>
        <button class="btn btn-green btn-sm btn-icon" onclick="shareFile('${file.id}')" title="Share"><img src="images/share-t.png" width="16" height="16" style="object-fit:contain;vertical-align:middle;"/></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openRenameFileModal('${file.id}','${file.name.replace(/'/g,"\'")}')  " title="Rename"><img src="https://img.icons8.com/?size=100&id=12953&format=png&color=000000" width="16" height="16" style="object-fit:contain;vertical-align:middle;"/></button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openMoveModal('${file.id}')" title="Move"><img src="https://img.icons8.com/?size=100&id=D6Jff0ou6Eza&format=png&color=000000" width="16" height="16" style="object-fit:contain;vertical-align:middle;"/></button> 
      </div>
    </div>`;
  }).join('');
}
 
// ════════════════════════════════════════════════════════
// FILE SELECTION
// ════════════════════════════════════════════════════════
function toggleFileSel(id) {
  if(state.selectedFiles.has(id)) state.selectedFiles.delete(id); else state.selectedFiles.add(id);
  const c=$id('fc-'+id); if(c) c.classList.toggle('selected',state.selectedFiles.has(id));
  const n=state.selectedFiles.size;
  $id('selectionBar').classList.toggle('show',n>0);
  setText('selectionCount',n+' ឯកសារ');
}
function clearSelection() {
  state.selectedFiles.forEach(id=>{const c=$id('fc-'+id);if(c)c.classList.remove('selected');});
  state.selectedFiles.clear();
  $id('selectionBar').classList.remove('show');
}
 
// ════════════════════════════════════════════════════════
// FILE ACTIONS
// ════════════════════════════════════════════════════════
async function downloadFile(id) {
  const file = state.files.find(f => f.id === id);
  const name = file?.name || 'file';
  toast('កំពុងទាញ ' + name + '...', 'info');
  try {
    const res = await fetch(API_BASE + '/files/' + id + '/download', {
      headers: { 'Authorization': 'Bearer ' + (getToken() || '') }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Download failed (' + res.status + ')');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('ទាញ ' + name + ' ជោគជ័យ!', 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
}
 
function shareFile(id) { state.selectedFiles.add(id); openShareModal(); }
 
async function deleteFile(id) {
  if(!confirm('លុបឯកសារនេះ?')) return;
  try {
    await api('DELETE','/files/'+id);
    state.files=state.files.filter(f=>f.id!==id);
    toast('ឯកសារត្រូវបានលុប','success');
    renderCurrentPage(); updateBadge();
  } catch(e) { toast(e.message,'error'); }
}
 
async function deleteSelected() {
  const ids=[...state.selectedFiles];
  if(!ids.length) return;
  if(!confirm('លុប '+ids.length+' ឯកសារ?')) return;
  try {
    await Promise.all(ids.map(id=>api('DELETE','/files/'+id)));
    state.files=state.files.filter(f=>!state.selectedFiles.has(f.id));
    clearSelection(); updateBadge();
    toast('លុប '+ids.length+' ឯកសារ','success');
    renderCurrentPage();
  } catch(e) { toast(e.message,'error'); }
}
 
// ════════════════════════════════════════════════════════
// UPLOAD
// ════════════════════════════════════════════════════════
function handleDragOver(e)  { e.preventDefault(); $id('uploadZone').classList.add('drag-over'); }
function handleDragLeave(e) { $id('uploadZone').classList.remove('drag-over'); }
function handleDrop(e)      { e.preventDefault(); $id('uploadZone').classList.remove('drag-over'); processUpload(Array.from(e.dataTransfer.files)); }
function handleFileSelect(e){ processUpload(Array.from(e.target.files)); }
 
async function processUpload(files) {
  if (!files.length) return;
  if (!state.currentTeamId) { toast('ជ្រើសក្រុមជាមុន','error'); return; }
 
  // ── Check & resolve duplicate names before uploading ──
  const existingInFolder = state.files.filter(f =>
    (f.folderId||null) === (currentFolderId||null)
  );
  const renamedFiles = [];
  const renamedLog   = [];
 
  for (const file of files) {
    const resolved = resolveUploadName(file.name, [...existingInFolder, ...renamedFiles.map(rf => ({ name: rf.newName }))]);
    if (resolved !== file.name) {
      // Create a new File with the resolved name
      const renamed = new File([file], resolved, { type: file.type });
      renamedFiles.push({ original: file.name, newName: resolved, file: renamed });
      renamedLog.push('"' + file.name + '" → "' + resolved + '"');
    } else {
      renamedFiles.push({ original: file.name, newName: resolved, file });
    }
  }
 
  // Notify user about any renames
  if (renamedLog.length) {
    toast('ឈ្មោះស្ទួន ប្ដូរ: ' + renamedLog.join(', '), 'info');
  }
 
  const pw = $id('uploadProgress'), pb = $id('uploadBar');
  pw.style.display = 'block'; pb.style.width = '10%';
 
  try {
    const fd = new FormData();
    fd.append('teamId', state.currentTeamId);
    if (currentFolderId) fd.append('folderId', currentFolderId);
 
    // Append renamed files with original name hint
    renamedFiles.forEach(rf => {
      fd.append('files', rf.file);
      fd.append('originalNames', rf.newName); // resolved name
    });
 
    let p = 10;
    const t = setInterval(() => { p = Math.min(p + Math.random() * 12, 88); pb.style.width = p + '%'; }, 200);
    const d = await api('POST', '/files/upload', fd, true);
    clearInterval(t); pb.style.width = '100%';
 
    setTimeout(() => { pw.style.display = 'none'; pb.style.width = '0%'; }, 600);
 
    const nf = (d.files || []).map(normalizeFile);
    state.files = [...nf, ...state.files];
    toast('Upload ' + nf.length + ' ឯកសារ ជោគជ័យ!', 'success');
    renderPreviewList(); updateBadge();
 
  } catch(e) {
    pw.style.display = 'none'; pb.style.width = '0%';
    toast('Upload failed: ' + e.message, 'error');
  }
}
 
function renderPreviewList() {
  const recent=[...state.files].sort((a,b)=>b.uploadedAt-a.uploadedAt).slice(0,5);
  $id('uploadPreviewList').innerHTML = recent.length?`
    <h3 style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:11px">ឯកសារចុងក្រោយ</h3>
    ${recent.map(f=>`
      <div style="display:flex;align-items:center;gap:11px;padding:11px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:7px">
        <span style="font-size:22px">${getFileIcon(f.name)}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
          <div style="font-size:11px;color:var(--text3)">${formatSize(f.size)} · ${formatDate(f.uploadedAt)}</div>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="downloadFile('${f.id}')">
          <img src="https://img.icons8.com/?size=100&id=VGQlJM067vkN&format=png&color=000000" width="20" height="20" style="object-fit:contain;vertical-align:middle;"/>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFile('${f.id}')">
          <img src="https://img.icons8.com/?size=100&id=102350&format=png&color=000000" width="20" height="20" style="object-fit:contain;vertical-align:middle;"/>
        </button>
      </div>`).join('')}
  `:'';
}
 
// ════════════════════════════════════════════════════════
// FOLDER CRUD
// ════════════════════════════════════════════════════════
function openCreateFolderModal() {
  const loc=currentFolderBreadcrumb.length?currentFolderBreadcrumb[currentFolderBreadcrumb.length-1].name:'Home';
  $id('newFolderName').value='';
  $id('createFolderModal').classList.add('open');
  setTimeout(()=>$id('newFolderName').focus(),100);
}
async function createFolder() {
  const name=$id('newFolderName').value.trim();
  if(!name){ toast('ដាក់ឈ្មោះថត','error'); return; }
  try {
    await api('POST','/folders',{teamId:state.currentTeamId,name,parentId:currentFolderId});
    closeModal('createFolderModal');
    toast('"'+name+'" ជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
function openRenameFolder(id,cur) {
  $id('renameFolderId').value=id; $id('renameFolderInput').value=cur;
  $id('renameFolderModal').classList.add('open');
  setTimeout(()=>$id('renameFolderInput').focus(),100);
}
async function renameFolder() {
  const id=$id('renameFolderId').value, name=$id('renameFolderInput').value.trim();
  if(!name){ toast('ដាក់ឈ្មោះថ្មី','error'); return; }
  try {
    await api('PUT','/folders/'+id,{name});
    closeModal('renameFolderModal');
    toast('ប្ដូរឈ្មោះជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
async function deleteFolder(id,name) {
  if(!confirm('លុបថត "'+name+'" និងឯកសារទាំងអស់?')) return;
  try {
    await api('DELETE','/folders/'+id);
    toast(' លុបថត "'+name+'"','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
async function downloadFolder(id,name) {
  toast('កំពុងបង្ហាប់ ZIP...','info');
  try {
    const blob=await fetchBlob('/folders/'+id+'/download');
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name+'.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('ZIP ទាញជោគជ័យ!','success');
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// FOLDER CRUD
// ════════════════════════════════════════════════════════
function openCreateFolderModal() {
  const loc=currentFolderBreadcrumb.length?currentFolderBreadcrumb[currentFolderBreadcrumb.length-1].name:'Home';
  setText('createFolderLocation',loc);
  $id('newFolderName').value='';
  $id('createFolderModal').classList.add('open');
  setTimeout(()=>$id('newFolderName').focus(),100);
}
async function createFolder() {
  const name=$id('newFolderName').value.trim();
  if(!name){ toast('ដាក់ឈ្មោះថត','error'); return; }
  try {
    await api('POST','/folders',{teamId:state.currentTeamId,name,parentId:currentFolderId});
    closeModal('createFolderModal');
    toast('"'+name+'" ជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
function openRenameFolder(id,cur) {
  $id('renameFolderId').value=id; $id('renameFolderInput').value=cur;
  $id('renameFolderModal').classList.add('open');
  setTimeout(()=>$id('renameFolderInput').focus(),100);
}
async function renameFolder() {
  const id=$id('renameFolderId').value, name=$id('renameFolderInput').value.trim();
  if(!name){ toast('ដាក់ឈ្មោះថ្មី','error'); return; }
  try {
    await api('PUT','/folders/'+id,{name});
    closeModal('renameFolderModal');
    toast('ប្ដូរឈ្មោះជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
async function deleteFolder(id,name) {
  if(!confirm('លុបថត "'+name+'" និងឯកសារទាំងអស់?')) return;
  try {
    await api('DELETE','/folders/'+id);
    toast('លុបថត "'+name+'"','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
async function downloadFolder(id,name) {
  toast('កំពុងបង្ហាប់ ZIP...','info');
  try {
    const blob=await fetchBlob('/folders/'+id+'/download');
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=name+'.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('ZIP ទាញជោគជ័យ!','success');
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// MOVE FILE
// ════════════════════════════════════════════════════════
async function openMoveModal(fileId) {
  $id('moveFileId').value=fileId;
  try {
    const d=await api('GET','/folders?teamId='+state.currentTeamId);
    const folders=d.folders||[];
    $id('moveFolderList').innerHTML=folders.length?folders.map(f=>
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;cursor:pointer;margin-bottom:5px;transition:border-color .15s" '
      +'onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\'" '
      +'onclick="moveFileTo(\''+f.id+'\',\''+f.name.replace(/'/g,"\\'")+'\')"> '
      +'<span style="font-size:19px">📁</span>'
      +'<div><div style="font-size:13px;font-weight:600">'+f.name+'</div>'
      +'<div style="font-size:11px;color:var(--text3)">'+(f.file_count||0)+' ឯកសារ</div></div>'
      +'</div>'
    ).join(''):'<p style="color:var(--text3);font-size:13px;padding:8px">មិនមានថត — បង្កើតថតជាមុន</p>';
  } catch(e){ toast(e.message,'error'); }
  $id('moveFileModal').classList.add('open');
}
async function moveFileTo(folderId,folderName) {
  const fileId=$id('moveFileId').value;
  try {
    await api('PUT','/files/'+fileId+'/move',{folderId});
    closeModal('moveFileModal');
    toast('ផ្លាស់ប្ដូរទៅ "'+folderName+'" ជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}
async function moveFileToRoot() {
  const fileId=$id('moveFileId').value;
  try {
    await api('PUT','/files/'+fileId+'/move',{folderId:null});
    closeModal('moveFileModal');
    toast('ផ្លាស់ប្ដូរទៅ Root ជោគជ័យ!','success');
    renderFilesPage(currentFolderId);
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// FILE VIEWER
// ════════════════════════════════════════════════════════
function viewFileById(id) { const f=state.files.find(x=>x.id===id); if(f) viewFile(f); }

function viewFile(file) {
  currentViewFile = file;
  setText('viewerFileName', file.name);
  setText('viewerFileMeta',
    formatSize(file.size) + ' · ' + formatDate(file.uploadedAt) +
    (file.uploaderName ? ' · by ' + file.uploaderName : '')
  );
  $id('viewerDownloadBtn').onclick = () => downloadFile(file.id);

  const box  = $id('viewerContent');
  const ext  = file.name.split('.').pop().toLowerCase();
  const token = getToken() || '';
  const vUrl  = API_BASE + '/files/' + file.id + '/view';
  const opts  = { headers: { 'Authorization': 'Bearer ' + token } };

  box.innerHTML = '<div style="color:var(--text3);padding:40px;font-size:14px;text-align:center">⏳ កំពុងទាញ...</div>';

  // ── Helper: fetch with auth, follow redirects (works for both local + Cloudinary) ──
  async function fetchFile(type) {
    // First try direct fetch
    const r = await fetch(vUrl, opts);
    // If it redirected to Cloudinary, r.url is the final Cloudinary URL
    if (type === 'blob')        return r.blob();
    if (type === 'arrayBuffer') return r.arrayBuffer();
    if (type === 'text')        return r.text();
  }

  // ── IMAGES ──────────────────────────────────────────────
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) {
    fetchFile('blob').then(b => {
      box.innerHTML = '<img src="' + URL.createObjectURL(b) + '" style="max-width:100%;max-height:100%;object-fit:contain">';
    }).catch(e => showViewerError(box, file, e.message));

  // ── PDF ─────────────────────────────────────────────────
  } else if (ext === 'pdf') {
    fetchFile('blob').then(b => {
      box.innerHTML = '<iframe src="' + URL.createObjectURL(b) + '" style="width:100%;height:100%;border:none"></iframe>';
    }).catch(e => showViewerError(box, file, e.message));

  // ── EXCEL / XLS / XLSX / CSV ─────────────────────────────
  } else if (['xlsx','xls'].includes(ext)) {
    if (!window.XLSX) {
      showViewerError(box, file, 'SheetJS library not loaded — refresh page');
      return;
    }
    fetchFile('arrayBuffer').then(buf => {
      try {
        const wb   = XLSX.read(new Uint8Array(buf), { type: 'array' });
        const tabs = wb.SheetNames;

        // Build tab buttons for multiple sheets
        const tabButtons = tabs.map((name, i) =>
          '<button onclick="switchExcelSheet(' + i + ',wb_' + file.id + ')" ' +
          'id="extab_' + i + '" style="padding:5px 14px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:12px;' +
          (i === 0 ? 'background:#1a73e8;color:#fff;border-color:#1a73e8' : 'background:#fff;color:#333') + '">' +
          name + '</button>'
        ).join('');

        const firstSheet = XLSX.utils.sheet_to_html(wb.Sheets[tabs[0]], { editable: false });

        box.innerHTML =
          '<div style="height:100%;display:flex;flex-direction:column;background:#fff">' +
            '<div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
              '<span style="font-size:12px;color:#666;margin-right:4px">📊 Sheets:</span>' +
              tabButtons +
            '</div>' +
            '<div id="xlsViewBody" style="overflow:auto;flex:1;padding:0">' +
              '<style>' +
                '#xlsViewBody table{border-collapse:collapse;font-size:12px;font-family:Arial,sans-serif;width:max-content}' +
                '#xlsViewBody td,#xlsViewBody th{border:1px solid #e0e0e0;padding:5px 10px;white-space:nowrap;min-width:60px}' +
                '#xlsViewBody tr:first-child td,#xlsViewBody th{background:#e8f0fe;font-weight:600;position:sticky;top:0;z-index:1}' +
                '#xlsViewBody tr:nth-child(even) td{background:#f8f9fa}' +
                '#xlsViewBody tr:hover td{background:#e3f2fd}' +
              '</style>' +
              firstSheet +
            '</div>' +
          '</div>';

        // Store workbook on window for tab switching
        window['wb_' + file.id] = wb;
      } catch(e) {
        showViewerError(box, file, 'Excel parse error: ' + e.message);
      }
    }).catch(e => showViewerError(box, file, e.message));

  // ── CSV ──────────────────────────────────────────────────
  } else if (ext === 'csv') {
    fetchFile('text').then(text => {
      if (!window.XLSX) {
        // Fallback: render as plain table
        const rows = text.trim().split('\n').map(r => r.split(','));
        const header = rows[0].map(h => '<th style="background:#e8f0fe;padding:6px 12px;border:1px solid #ccc;font-size:12px">' + h.trim() + '</th>').join('');
        const body   = rows.slice(1).map((r,i) =>
          '<tr style="background:' + (i%2===0?'#fff':'#f8f9fa') + '">' +
          r.map(c => '<td style="padding:5px 10px;border:1px solid #e0e0e0;font-size:12px">' + c.trim() + '</td>').join('') +
          '</tr>'
        ).join('');
        box.innerHTML = '<div style="overflow:auto;padding:12px;background:#fff"><table style="border-collapse:collapse"><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table></div>';
        return;
      }
      const wb   = XLSX.read(text, { type: 'string' });
      const html = XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]], { editable: false });
      box.innerHTML =
        '<div style="overflow:auto;height:100%;padding:12px;background:#fff">' +
          '<style>#csvBody table{border-collapse:collapse;font-size:12px}#csvBody td,#csvBody th{border:1px solid #e0e0e0;padding:5px 10px}#csvBody tr:first-child td{background:#e8f0fe;font-weight:600}</style>' +
          '<div id="csvBody">' + html + '</div>' +
        '</div>';
    }).catch(e => showViewerError(box, file, e.message));

  // ── WORD / DOCX ──────────────────────────────────────────
  } else if (ext === 'docx') {
    if (!window.mammoth) {
      showViewerError(box, file, 'Mammoth.js library not loaded — refresh page');
      return;
    }
    fetchFile('arrayBuffer').then(buf => {
      mammoth.convertToHtml({ arrayBuffer: buf }, {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ]
      }).then(result => {
        box.innerHTML =
          '<div style="overflow:auto;height:100%;padding:28px 36px;background:#fff;color:#1a1a1a">' +
            '<style>' +
              '#wordBody{max-width:760px;margin:0 auto;font-family:Georgia,serif;line-height:1.8}' +
              '#wordBody h1{font-size:22px;color:#1a1a2e;margin:20px 0 10px;border-bottom:2px solid #e0e0e0;padding-bottom:6px}' +
              '#wordBody h2{font-size:18px;color:#1a1a2e;margin:18px 0 8px}' +
              '#wordBody h3{font-size:15px;color:#333;margin:14px 0 6px}' +
              '#wordBody p{margin:0 0 12px;font-size:14px}' +
              '#wordBody table{border-collapse:collapse;width:100%;margin:14px 0}' +
              '#wordBody td,#wordBody th{border:1px solid #ccc;padding:7px 12px;font-size:13px}' +
              '#wordBody th{background:#f5f5f5;font-weight:600}' +
              '#wordBody ul,#wordBody ol{padding-left:26px;margin:8px 0}' +
              '#wordBody li{margin-bottom:4px;font-size:14px}' +
              '#wordBody img{max-width:100%;border-radius:6px;margin:8px 0}' +
              '#wordBody strong{color:#1a1a2e}' +
            '</style>' +
            '<div id="wordBody">' + result.value + '</div>' +
            (result.messages.length ? '<p style="color:#f59e0b;font-size:11px;margin-top:16px">⚠️ Some formatting may not display perfectly</p>' : '') +
          '</div>';
      }).catch(e => showViewerError(box, file, 'Word parse error: ' + e.message));
    }).catch(e => showViewerError(box, file, e.message));

  // ── DOC (old format — cannot parse in browser) ──────────
  } else if (ext === 'doc') {
    box.innerHTML =
      '<div style="text-align:center;padding:50px">' +
        '<div style="font-size:56px;margin-bottom:14px"><img src="images/create.png" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/></div>' +
        '<p style="color:#555;font-size:15px;font-weight:600;margin-bottom:8px">' + file.name + '</p>' +
        '<p style="color:#999;font-size:13px;margin-bottom:6px">ឯកសារ .doc (Word 97-2003) មិនអាចបង្ហាញក្នុង browser</p>' +
        '<p style="color:#999;font-size:12px;margin-bottom:20px">សូម Save As .docx ដើម្បីអាចមើលបាន</p>' +
        '<button class="btn btn-primary btn-sm" onclick="downloadFile(\'' + file.id + '\')">⬇️ Download to open</button>' +
      '</div>';

  // ── VIDEO ────────────────────────────────────────────────
  } else if (['mp4','webm'].includes(ext)) {
    fetchFile('blob').then(b => {
      box.innerHTML = '<video controls src="' + URL.createObjectURL(b) + '" style="max-width:100%;max-height:100%"></video>';
    }).catch(e => showViewerError(box, file, e.message));

  // ── AUDIO ────────────────────────────────────────────────
  } else if (['mp3','wav','ogg'].includes(ext)) {
    fetchFile('blob').then(b => {
      box.innerHTML = '<div style="padding:50px;text-align:center"><p style="font-size:56px">🎵</p><p style="color:#666;margin:10px 0 18px;font-size:14px">' + file.name + '</p><audio controls src="' + URL.createObjectURL(b) + '" style="width:80%"></audio></div>';
    }).catch(e => showViewerError(box, file, e.message));

  // ── TEXT / CODE ──────────────────────────────────────────
  } else if (['txt','md','js','ts','html','css','json','xml','py','java','cpp','c','php','sql','sh','yaml','yml','env'].includes(ext)) {
    fetchFile('text').then(t => {
      const escaped = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      box.innerHTML =
        '<div style="height:100%;overflow:auto;background:#1e1e1e">' +
          '<div style="padding:10px 14px;background:#2d2d2d;font-size:11px;color:#aaa;display:flex;justify-content:space-between">' +
            '<span>' + ext.toUpperCase() + ' · ' + file.name + '</span>' +
            '<span>' + t.split("\n").length + ' lines</span>' +
          '</div>' +
          '<pre style="margin:0;padding:16px 20px;color:#d4d4d4;font-family:Consolas,Monaco,monospace;font-size:13px;line-height:1.6;overflow:auto">' +
            escaped +
          '</pre>' +
        '</div>';
    }).catch(e => showViewerError(box, file, e.message));

  // ── UNSUPPORTED ──────────────────────────────────────────
  } else {
    showViewerError(box, file, null);
  }

  $id('viewerModal').classList.add('open');
}

// ── Excel sheet tab switcher ─────────────────────────────
function switchExcelSheet(sheetIndex, wb) {
  if (!wb) return;
  const sheetName = wb.SheetNames[sheetIndex];
  const html = XLSX.utils.sheet_to_html(wb.Sheets[sheetName], { editable: false });
  const body = $id('xlsViewBody');
  if (body) body.innerHTML =
    '<style>#xlsViewBody table{border-collapse:collapse;font-size:12px;font-family:Arial,sans-serif;width:max-content}#xlsViewBody td,#xlsViewBody th{border:1px solid #e0e0e0;padding:5px 10px;white-space:nowrap;min-width:60px}#xlsViewBody tr:first-child td,#xlsViewBody th{background:#e8f0fe;font-weight:600;position:sticky;top:0;z-index:1}#xlsViewBody tr:nth-child(even) td{background:#f8f9fa}</style>' +
    html;
  // Update active tab button style
  document.querySelectorAll('[id^="extab_"]').forEach((btn, i) => {
    btn.style.background     = i === sheetIndex ? '#1a73e8' : '#fff';
    btn.style.color          = i === sheetIndex ? '#fff' : '#333';
    btn.style.borderColor    = i === sheetIndex ? '#1a73e8' : '#ccc';
  });
}

// ── Viewer error fallback ────────────────────────────────
function showViewerError(box, file, reason) {
  box.innerHTML =
    '<div style="text-align:center;padding:50px">' +
      '<div style="font-size:64px;margin-bottom:14px">' + getFileIcon(file.name) + '</div>' +
      '<p style="color:#555;font-size:15px;font-weight:600;margin-bottom:8px">' + file.name + '</p>' +
      (reason
        ? '<p style="color:#e74c3c;font-size:12px;margin-bottom:16px;background:#ffeaea;padding:8px 14px;border-radius:8px;display:inline-block">⚠️ ' + reason + '</p>'
        : '<p style="color:#999;font-size:13px;margin-bottom:16px">ប្រភេទឯកសារនេះមិនអាចបង្ហាញក្នុង browser</p>'
      ) +
      '<br><button class="btn btn-primary btn-sm" onclick="downloadFile(\'' + file.id + '\')">Download to open</button>' +
    '</div>';
}

// ════════════════════════════════════════════════════════
// QR CODE
// ════════════════════════════════════════════════════════
async function openQrModal() {
  if (!currentViewFile) return;
  closeModal('viewerModal');
  try {
    const d=await api('POST','/files/'+currentViewFile.id+'/share',{});
    setText('qrFileName',currentViewFile.name);
    $id('qrModal').classList.add('open');
    setTimeout(()=>drawQR(d.shareUrl),200);
  } catch(e){ toast(e.message,'error'); }
}
function drawQR(text) {
  const container=$id('qrCodeContainer'); container.innerHTML='';
  if (window.QRCode) {
    const div=document.createElement('div');
    div.style.cssText='background:#182040;padding:10px;border-radius:11px;display:inline-block';
    container.appendChild(div);
    try { new QRCode(div,{text,width:210,height:210,colorDark:'#e8eeff',colorLight:'#182040'}); }
    catch(e){ fallbackQR(container,text); }
  } else { fallbackQR(container,text); }
}
function fallbackQR(container,text) {
  const img=document.createElement('img');
  img.style.cssText='border-radius:11px;display:block;width:210px;height:210px';
  img.src='https://api.qrserver.com/v1/create-qr-code/?size=210x210&data='+encodeURIComponent(text)+'&bgcolor=182040&color=e8eeff&margin=10&format=png';
  container.appendChild(img);
}
function downloadQrImage() {
  const c=$id('qrCodeContainer');
  const img=c.querySelector('img'), canvas=c.querySelector('canvas');
  const name=(currentViewFile?.name||'file')+'-qr.png';
  if (canvas) { const a=document.createElement('a'); a.download=name; a.href=canvas.toDataURL('image/png'); a.click(); }
  else if (img) { fetch(img.src).then(r=>r.blob()).then(b=>{ const a=document.createElement('a'); a.download=name; a.href=URL.createObjectURL(b); a.click(); }).catch(()=>window.open(img.src,'_blank')); }
}

// ════════════════════════════════════════════════════════
// SHARE
// ════════════════════════════════════════════════════════
function openShareModal() {
  const count=state.selectedFiles.size;
  if(count===0){ toast('ជ្រើសឯកសារជាមុន','error'); return; }
  const names=[...state.selectedFiles].map(id=>{ const f=state.files.find(x=>x.id===id); return f?f.name:id; });
  setText('shareModalDesc', count+' ឯកសារ: '+names.slice(0,2).join(', ')+(names.length>2?'...':''));
  $id('shareLinkInput').value='កំពុងបង្កើត...';
  $id('shareModal').classList.add('open');
  genShareLink();
}
async function genShareLink() {
  const ids=[...state.selectedFiles]; if(!ids.length) return;
  try {
    const d=await api('POST','/files/'+ids[0]+'/share',{platform:null});
    $id('shareLinkInput').value=d.shareUrl||'';
  } catch(e){ $id('shareLinkInput').value='Error: '+e.message; }
}
 
// ════════════════════════════════════════════════════════
// SHARE FUNCTIONS
// ════════════════════════════════════════════════════════
 
// Download a file as a File object (with auth)
async function fetchFileBlob(fileId) {
  const blob = await fetchBlob('/files/' + fileId + '/download');
  const file = state.files.find(f => f.id === fileId);
  return new File([blob], file?.name || 'file', { type: blob.type || 'application/octet-stream' });
}
 
// Trigger a file save to disk
function triggerDownload(fileObj) {
  const u = URL.createObjectURL(fileObj);
  const a = document.createElement('a');
  a.href = u; a.download = fileObj.name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
 
// Get or generate a public share link for a file
async function getShareLink(fileId) {
  const data = await api('POST', '/files/' + fileId + '/share', {});
  return data.shareUrl || '';
}
 
// ── Open share modal ──────────────────────────────────
function openShareModal() {
  const count = state.selectedFiles.size;
  if (count === 0) { toast('ជ្រើសឯកសារជាមុន', 'error'); return; }
  const names = [...state.selectedFiles].map(id => {
    const f = state.files.find(x => x.id === id);
    return f ? f.name : id;
  });
  setText('shareModalDesc',
    count + ' ឯកសារ: ' + names.slice(0, 2).join(', ') + (names.length > 2 ? ' ...' : '')
  );
  // Load share link immediately
  const linkInput = $id('shareLinkInput');
  if (linkInput) {
    linkInput.value = 'កំពុងបង្កើត...';
    getShareLink([...state.selectedFiles][0])
      .then(link => { if (linkInput) linkInput.value = link; })
      .catch(() => { if (linkInput) linkInput.value = 'Error'; });
  }
  $id('shareModal').classList.add('open');
}
 
// ── Copy share link ───────────────────────────────────
async function copyShareLink() {
  const ids = [...state.selectedFiles];
  try {
    const link = ids.length > 0
      ? await getShareLink(ids[0])
      : ($id('shareLinkInput')?.value || '');
    await navigator.clipboard.writeText(link);
    toast(' ចម្លង Link ជោគជ័យ! Paste ក្នុង Telegram', 'success');
  } catch(e) {
    // Fallback: select text in input
    const inp = $id('shareLinkInput');
    if (inp) { inp.select(); document.execCommand('copy'); }
    toast(' ចម្លង Link ជោគជ័យ!', 'success');
  }
  closeModal('shareModal');
}
 
// ── QR for share link ─────────────────────────────────
async function shareQrOnly() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  closeModal('shareModal');
  try {
    const data = await api('POST', '/files/' + ids[0] + '/share', {});
    currentViewFile = state.files.find(f => f.id === ids[0]);
    setText('qrFileName', currentViewFile?.name || '');
    $id('qrModal').classList.add('open');
    setTimeout(() => drawQR(data.shareUrl), 200);
  } catch(e) { toast(e.message, 'error'); }
}
 
// ════════════════════════════════════════════════════════
// TELEGRAM — 3 methods
// ════════════════════════════════════════════════════════
 
async function shareToTelegramBot() {
  const ids = [...state.selectedFiles];
  if (!ids.length) { toast('ជ្រើសឯកសារជាមុន', 'error'); return; }
  closeModal('shareModal');
 
  // Generate share links for all selected files
  const links = [];
  for (const id of ids) {
    try {
      const link = await getShareLink(id);
      const file = state.files.find(f => f.id === id);
      links.push({ name: file?.name || id, link });
    } catch(e) {}
  }
 
  // Populate the Telegram bot modal
  const firstLink = links[0]?.link || '';
  const tgInput   = $id('tgShareLink');
  if (tgInput) tgInput.value = firstLink;
 
  // Store all links for the copy function
  window._tgLinks = links;
 
  $id('tgBotModal').classList.add('open');
 
  // Mark files as shared in DB
  try {
    await Promise.all(ids.map(id => api('POST', '/files/' + id + '/share', { platform: 'telegram' })));
    ids.forEach(id => { const f = state.files.find(x => x.id === id); if (f) f.shared = true; });
  } catch(_) {}
}
 
async function copyTgLink() {
  const links = window._tgLinks || [];
  const tgInput = $id('tgShareLink');
  const link = tgInput?.value || '';
 
  // If multiple files, copy all links
  const textToCopy = links.length > 1
    ? links.map(l => l.name + ':' + l.link).join('')
    : link;
 
  try {
    await navigator.clipboard.writeText(textToCopy);
    toast('Copy Link ជោគជ័យ! ➜ Paste ក្នុង Telegram ➜ Send', 'success');
  } catch(e) {
    if (tgInput) { tgInput.select(); document.execCommand('copy'); }
    toast('Copy Link ជោគជ័យ!', 'success');
  }
 
  // Also open Telegram after copying
  setTimeout(() => {
    // Try Telegram deep link with the URL
    const tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent(link) +
      '&text=' + encodeURIComponent('ឯកសារពី PureDocs GENZ1');
    window.open(tgUrl, '_blank');
  }, 500);
}
 
async function downloadAndOpenTelegram() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
 
  toast('⏳ កំពុងទាញ...', 'info');
  try {
    for (const id of ids) {
      const fileObj = await fetchFileBlob(id);
      triggerDownload(fileObj);
      await new Promise(r => setTimeout(r, 400));
    }
    toast('ឯកសារទាញហើយ! កំពុងបើក Telegram...', 'success');
    setTimeout(() => window.open('https://web.telegram.org', '_blank'), 800);
    closeModal('tgBotModal');
    showDownloadedHint(ids);
  } catch(e) {
    toast('Download failed: ' + e.message, 'error');
  }
}
 
async function mobileNativeShare() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
 
  if (!navigator.share) {
    toast('Native share មិនអាចប្រើបានលើ desktop ប្រើ Copy Link ជំនួស', 'error');
    return;
  }
 
  try {
    toast('កំពុងត្រៀម file...', 'info');
    const fileObjs = await Promise.all(ids.map(id => fetchFileBlob(id)));
 
    if (navigator.canShare && navigator.canShare({ files: fileObjs })) {
      await navigator.share({
        title: 'ឯកសារពី PureDocs KH',
        text:  'ចែករំលែក: ' + fileObjs.map(f => f.name).join(', '),
        files: fileObjs,
      });
      toast(' ចែករំលែកជោគជ័យ!', 'success');
      closeModal('tgBotModal');
    } else {
      // Can share URLs instead
      const link = await getShareLink(ids[0]);
      await navigator.share({ title: fileObjs[0].name, url: link });
      toast(' ចែករំលែក Link ជោគជ័យ!', 'success');
    }
  } catch(e) {
    if (e.name !== 'AbortError') toast(e.message, 'error');
  }
}
 
function showDownloadedHint(ids) {
  const names = ids.map(id => state.files.find(f => f.id === id)?.name || '').filter(Boolean).join(', ');
  const old = $id('desktopHint'); if (old) old.remove();
  const h = document.createElement('div'); h.id = 'desktopHint';
  h.innerHTML =
    '<div style="position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
    'background:#1e2a4a;border:1px solid #29a3de;border-radius:14px;padding:16px 20px;' +
    'z-index:400;box-shadow:0 16px 48px rgba(0,0,0,.6);max-width:380px;width:90%">' +
      '<div style="display:flex;gap:11px;align-items:flex-start">' +
        '<span style="font-size:24px">✈️</span>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:700;color:#e8eeff;margin-bottom:6px">ឯកសារទាញហើយ!</div>' +
          '<div style="font-size:12px;color:#9aacce;line-height:1.7">' +
            '<strong style="color:#29a3de">' + names + '</strong> ស្ថិតក្នុង <strong>Downloads</strong><br>' +
            'ក្នុង Telegram Web:<br>' +
            '1. ចុច 📎 (Attach) ខាងក្រោម chat<br>' +
            '2. ជ្រើស <strong>File</strong><br>' +
            '3. ជ្រើស file ពី Downloads<br>' +
            '4. ចុច Send' +
          '</div>' +
        '</div>' +
        '<button onclick="this.parentElement.parentElement.parentElement.remove()" ' +
        'style="background:none;border:none;color:#5a6f9a;cursor:pointer;font-size:16px;padding:0">✕</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(h);
  setTimeout(() => { if (h.parentNode) h.remove(); }, 12000);
}
 
// ── Telegram link share (quick) ───────────────────────
async function shareToTelegramLink() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  try {
    const link = await getShareLink(ids[0]);
    const tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent(link) +
      '&text=' + encodeURIComponent('ឯកសារពី PureDocs GENZ1');
    window.open(tgUrl, '_blank');
    toast('Telegram បើករួចហើយ — ជ្រើស contact ហើយ Send!', 'success');
    closeModal('shareModal');
    // Mark as shared
    await Promise.all(ids.map(id => api('POST', '/files/' + id + '/share', { platform: 'telegram' })));
    ids.forEach(id => { const f = state.files.find(x => x.id === id); if (f) f.shared = true; });
    clearSelection(); renderCurrentPage();
  } catch(e) { toast(e.message, 'error'); }
}
 
// ── Other platforms ───────────────────────────────────
async function shareTo(platform) {
  const ids = [...state.selectedFiles];
  if (!ids.length) { toast('ជ្រើសឯកសារជាមុន', 'error'); return; }
 
  try {
    const link = await getShareLink(ids[0]);
 
    if (platform === 'facebook') {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link), '_blank');
 
    } else if (platform === 'zalo') {
      // Zalo: copy link + open Zalo
      try { await navigator.clipboard.writeText(link); } catch(_) {}
      window.open('https://chat.zalo.me', '_blank');
      toast('Link ចម្លងហើយ! Paste ក្នុង Zalo chat', 'success');
 
    } else if (platform === 'email') {
      const fileNames = ids.map(id => state.files.find(f => f.id === id)?.name || '').join(', ');
      const sub  = encodeURIComponent('ចែករំលែកឯកសារពី PureDocs GENZ1');
      const body = encodeURIComponent(
        'សូមជម្រាបជូន, ឯកសារ: ' + fileNames +
        'តំណទាញ: ' + link +
        ' (ចុចតំណ ឬ ទាញ file ដោយផ្ទាល់) PureDocs GENZ1'
      );
      window.open('mailto:?subject=' + sub + '&body=' + body, '_self');
      toast('Email app បើករួចហើយ!', 'success');
    }
 
    // Mark as shared
    await Promise.all(ids.map(id => api('POST', '/files/' + id + '/share', { platform })));
    ids.forEach(id => { const f = state.files.find(x => x.id === id); if (f) f.shared = true; });
 
    closeModal('shareModal'); clearSelection(); renderCurrentPage();
  } catch(e) { toast(e.message, 'error'); }
}
 
// ── Download all selected ─────────────────────────────
async function downloadSelected() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  toast('⏳ កំពុងទាញ ' + ids.length + ' ឯកសារ...', 'info');
  for (const id of ids) {
    try {
      triggerDownload(await fetchFileBlob(id));
      await new Promise(r => setTimeout(r, 400));
    } catch(e) { console.error('Download error:', e); }
  }
  toast('ទាញ ' + ids.length + ' ឯកសារ ជោគជ័យ!', 'success');
  closeModal('shareModal'); clearSelection();
}

// ════════════════════════════════════════════════════════
// TEAM
// ════════════════════════════════════════════════════════
// ── Team modal: list with rename/delete actions ──────────
async function openTeamModal() {
  try { const d = await api('GET','/teams'); state.teams = d.teams||[]; } catch(_) {}
  const isAdmin = state.currentUser?.role === 'admin';
  $id('teamList').innerHTML = state.teams.length ? state.teams.map(t => {
    const active = t.id === state.currentTeamId;
    const sn = t.name.replace(/'/g,"\'");
    return '<div style="display:flex;align-items:center;gap:10px;padding:11px 12px;'
      + 'background:' + (active?'rgba(79,142,247,.1)':'var(--bg2)') + ';'
      + 'border:1px solid ' + (active?'var(--accent)':'var(--border)') + ';'
      + 'border-radius:10px;transition:all .2s">'
      // Avatar + info (clickable to switch)
      + '<div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;min-width:0" onclick="switchTeam(`' + t.id + '`)">'
        + '<div style="width:32px;height:32px;border-radius:8px;background:' + (t.color||COLORS[0]) + ';'
        + 'display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0">'
        + getInitials(t.name) + '</div>'
        + '<div style="min-width:0">'
          + '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t.name + '</div>'
          + '<div style="font-size:11px;color:var(--text3)">' + (t.member_count||'?') + ' នាក់ · ' + t.code + '</div>'
        + '</div>'
        + (active ? '<span style="color:var(--accent3);margin-left:4px;flex-shrink:0">✓</span>' : '')
      + '</div>'
      // Action buttons (admin only)
      + (isAdmin ? '<div style="display:flex;gap:5px;flex-shrink:0">'
          + '<button class="btn btn-ghost btn-sm btn-icon" onclick="openRenameTeamModal(`' + t.id + '`,`' + sn + '`)" title="Rename"><img src="https://img.icons8.com/?size=100&id=91310&format=png&color=000000" width="20" height="20" style="object-fit:contain;vertical-align:middle;"/></button>'
          + '<button class="btn btn-danger btn-sm btn-icon" onclick="doDeleteTeam(`' + t.id + '`,`' + sn + '`)" title="Delete"><img src="https://img.icons8.com/?size=100&id=102350&format=png&color=000000" width="20" height="20" style="object-fit:contain;vertical-align:middle;"/></button>'
        + '</div>' : '')
      + '</div>';
  }).join('') : '<p style="color:var(--text3);font-size:13px;text-align:center;padding:12px">មិនមានក្រុម</p>';
  $id('teamModal').classList.add('open');
}
 
function switchTeam(id) {
  state.currentTeamId = id;
  state.files = []; currentFolderId = null; currentFolderBreadcrumb = [];
  updateSidebarTeam(); closeModal('teamModal'); renderDashboard();
  toast((state.teams.find(t=>t.id===id)?.name), 'success');
}
 
async function createTeam() {
  const name = $id('newTeamName').value.trim();
  if (!name) { toast('សូមវាយឈ្មោះក្រុម','error'); return; }
  try {
    const d = await api('POST','/teams',{name});
    state.teams.push(d.team);
    $id('newTeamName').value = '';
    switchTeam(d.team.id);
    toast('អ្នកបង្កើតក្រុម "' + name + '"!','success');
  } catch(e) { toast(e.message,'error'); }
}
 
// ── Rename team ───────────────────────────────────────────
function openRenameTeamModal(id, currentName) {
  $id('renameTeamId').value    = id;
  $id('renameTeamInput').value = currentName;
  closeModal('teamModal');
  $id('renameTeamModal').classList.add('open');
  setTimeout(() => $id('renameTeamInput').focus(), 100);
}
 
async function doRenameTeam() {
  const id   = $id('renameTeamId').value;
  const name = $id('renameTeamInput').value.trim();
  if (!name) { toast('សូមវាយឈ្មោះថ្មី','error'); return; }
  try {
    await api('PUT', '/teams/' + id + '/rename', { name });
    // Update local state
    const t = state.teams.find(x => x.id === id);
    if (t) t.name = name;
    updateSidebarTeam();
    closeModal('renameTeamModal');
    toast('✅ ប្ដូរឈ្មោះក្រុមជោគជ័យ → "' + name + '"','success');
  } catch(e) { toast(e.message,'error'); }
}
 
// ── Delete team ───────────────────────────────────────────
async function doDeleteTeam(id, name) {
  if (!confirm('⚠️ លុបក្រុម "' + name + '"? ការលុបនេះនឹងលុបឯកសារ និងថតទាំងអស់ក្នុងក្រុម!')) return;
  if (!confirm('ចុច OK ម្ដងទៀតដើម្បីបញ្ជាក់ — ការលុបមិនអាចដកវិញបានទេ!')) return;
  try {
    await api('DELETE', '/teams/' + id);
    state.teams = state.teams.filter(t => t.id !== id);
    // Switch to another team if this was the current one
    if (state.currentTeamId === id) {
      state.currentTeamId = state.teams.length > 0 ? state.teams[0].id : null;
      state.files = []; currentFolderId = null; currentFolderBreadcrumb = [];
      updateSidebarTeam();
    }
    closeModal('teamModal');
    toast('🗑️ លុបក្រុម "' + name + '" ជោគជ័យ','success');
    if (state.currentTeamId) renderDashboard();
  } catch(e) { toast(e.message,'error'); }
}
 
// ════════════════════════════════════════════════════════
// MEMBERS
// ════════════════════════════════════════════════════════
async function renderMembersPage() {
  const team   = state.teams.find(t => t.id === state.currentTeamId);
  const isAdmin = state.currentUser?.role === 'admin';
  setText('memberPageSub', team?.name || '');
 
  const statuses   = ['online','online','away','offline','online','online'];
  const statusLabel = { online:'អនឡាញ', away:'ផ្សេង', offline:'ក្រៅបណ្ដាញ' };
  const roleColors  = { admin:'var(--red)', editor:'var(--gold)', member:'var(--accent2)' };
  const roleLabel   = { admin:'Admin', editor:'Editor', member:'Member' };
 
  try {
    const d = await api('GET', '/teams/' + state.currentTeamId + '/members');
    const members = d.members || [];
 
    $id('membersGrid').innerHTML = members.length
      ? members.map((m, i) => {
          const isSelf    = m.id === state.currentUser?.id;
          const canRemove = isAdmin && !isSelf;
          const canChange = isAdmin && !isSelf;
          const st        = statuses[i % statuses.length];
          return `
          <div class="member-card" id="mc-${m.id}">
            <div class="member-avatar" style="background:${m.avatar_color || COLORS[i % COLORS.length]}">
              ${getInitials(m.name)}
            </div>
            <div class="member-info" style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <div class="mname">${m.name}</div>
                ${isSelf ? '<span style="font-size:10px;background:rgba(79,142,247,.15);color:var(--accent2);padding:1px 6px;border-radius:4px;font-weight:600">ខ្ញុំ</span>' : ''}
              </div>
              <div class="mrole" style="margin-top:3px">${m.email}</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:600;color:${roleColors[m.role]||'var(--text2)'};background:rgba(255,255,255,.06);padding:2px 8px;border-radius:5px">
                  ${roleLabel[m.role] || m.role}
                </span>
                <div class="mstatus">
                  <div class="status-dot ${st}"></div>
                  <span style="color:var(--text3);font-size:11px;margin-top:-4px;">${statusLabel[st]}</span>
                </div>
                ${m.email_verified
                  ? '<span style="font-size:10px;color:var(--accent3)"><img src="https://img.icons8.com/?size=100&id=yXOHowNYbgM5&format=png&color=000000" width="14" height="14" style="object-fit:contain;vertical-align:middle;"/>  verified</span>'
                  : '<span style="font-size:10px;color:var(--text3)">unverified</span>'}
              </div>
            </div>
            ${canRemove || canChange ? `
            <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
              ${canChange ? `
              <select onchange="changeMemberRole('${m.id}',this.value)"
                style="background:var(--bg2);border:1px solid var(--border);border-radius:7px;
                       padding:8px 9px;font-size:11px;color:var(--text2);font-family:inherit;cursor:pointer;outline:none">
                <option value="member"  ${m.role==='member' ?'selected':''}>Member</option>
                <option value="editor"  ${m.role==='editor' ?'selected':''}>Editor</option>
                <option value="admin"   ${m.role==='admin'  ?'selected':''}>Admin</option>
              </select>` : ''}
              ${canRemove ? `
              <button class="btn btn-danger btn-sm btn-icon"
                onclick="removeMember('${m.id}','${m.name.replace(/'/g,"\'")}')"
                title="ដកចេញពីក្រុម" style="font-size:12px;padding:7px 8px;">
                <img src="https://img.icons8.com/?size=100&id=oCStk6xZ1aK0&format=png&color=000000" width="14" height="14" style="object-fit:contain;"/> ដក
              </button>` : ''}
            </div>` : ''}
          </div>`;
        }).join('')
      : '<div class="empty-state" style="grid-column:1/-1"><div class="ei">👥</div><h3>មិនមានសមាជិក</h3></div>';
 
  } catch(e) { toast(e.message, 'error'); }
}
 
// ── Remove member from team ───────────────────────────
async function removeMember(userId, userName) {
  if (!confirm('ដក "' + userName + '" ចេញពីក្រុម?')) return;
  try {
    await api('DELETE', '/teams/' + state.currentTeamId + '/members/' + userId);
    // Remove card from DOM immediately (no reload)
    const card = $id('mc-' + userId);
    if (card) {
      card.style.transition = 'opacity .3s, transform .3s';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(.95)';
      setTimeout(() => card.remove(), 300);
    }
    toast('ដក "' + userName + '" ចេញជោគជ័យ', 'success');
    // Update member count in sidebar
    const team = state.teams.find(t => t.id === state.currentTeamId);
    if (team && team.member_count) {
      team.member_count = Math.max(0, (team.member_count || 1) - 1);
      updateSidebarTeam();
    }
  } catch(e) { toast(e.message, 'error'); }
}
 
// ── Change member role ────────────────────────────────
async function changeMemberRole(userId, newRole) {
  try {
    await api('PUT', '/teams/' + state.currentTeamId + '/members/' + userId, { role: newRole });
    toast('ប្ដូរ Role ជោគជ័យ → ' + newRole, 'success');
  } catch(e) {
    toast(e.message, 'error');
    renderMembersPage(); // revert UI on error
  }
}
 
function openInviteModal() { $id('inviteModal').classList.add('open'); }
 
async function sendInvite() {
  const email = $id('inviteEmail').value.trim();
  const role  = $id('inviteRole').value;
  if (!email) { toast('សូមបញ្ចូល Email', 'error'); return; }
  try {
    const d = await api('POST', '/teams/' + state.currentTeamId + '/invite', { email, role });
    toast('📨 ' + d.message, 'success');
    $id('inviteEmail').value = '';
    closeModal('inviteModal');
    renderMembersPage();
  } catch(e) { toast(e.message, 'error'); }
}

// ════════════════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════════════════
const ACT_ICONS={folder_create:'<img src="https://img.icons8.com/?size=100&id=fLQSwrK589zz&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;"/> ',
                  folder_rename:'<img src="https://img.icons8.com/?size=100&id=oJQSZNne5Rp0&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  folder_delete:'<img src="https://img.icons8.com/?size=100&id=102350&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  folder_download:'<img src="https://img.icons8.com/?size=100&id=12071&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_upload:'<img src="https://img.icons8.com/?size=100&id=1zyaKcD5FMHY&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_delete:'<img src="https://img.icons8.com/?size=100&id=102350&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_move:'<img src="https://img.icons8.com/?size=100&id=EAVjxPGPQ1Bn&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_share:'<img src="https://img.icons8.com/?size=100&id=80981&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_download:'<img src="https://img.icons8.com/?size=100&id=12071&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> ',
                  file_rename:'<img src="https://img.icons8.com/?size=100&id=oJQSZNne5Rp0&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> '};
const ACT_LABELS={folder_create:'បង្កើតFolder',folder_rename:'ប្ដូរឈ្មោះFolder',folder_delete:'លុបFolder',folder_download:'ទាញថត ZIP',file_upload:'Upload ឯកសារ',file_delete:'លុបឯកសារ',file_move:'ផ្លាស់ប្ដូរ',file_share:'ចែករំលែក',file_download:'ទាញឯកសារ'};

async function renderActivityPage() {
  if(!state.currentTeamId) return;
  const el=$id('activityList'); if(!el) return;
  el.innerHTML='កំពុងទាញ...</div>';
  try {
    const d=await api('GET','/files/activity?teamId='+state.currentTeamId+'&limit=100');
    const logs=d.logs||[];
    if(!logs.length){ el.innerHTML='<div class="empty-state"><div class="ei"><img src="https://img.icons8.com/?size=100&id=zJCy9v3GWPKd&format=png&color=000000" width="24" height="24" style="object-fit:contain;vertical-align:middle;margin-right:1px"/> </div><h3>មិនទាន់មានសកម្មភាព</h3><p>នឹងបង្ហាញនៅពេលក្រុមមានសកម្មភាព</p></div>'; return; }
    el.innerHTML=logs.map(log=>{
      const icon=ACT_ICONS[log.action]||'', label=ACT_LABELS[log.action]||log.action;
      let meta='';
      try {
        const m=log.meta?(typeof log.meta==='string'?JSON.parse(log.meta):log.meta):null;
        if(m?.old_name) meta=' ('+m.old_name+' → '+log.target_name+')';
        else if(m?.platform) meta=' តាម '+m.platform;
      } catch(_){}
      return '<div class="activity-item">'
        +'<div class="activity-avatar" style="background:'+(log.avatar_color||'var(--accent)')+'">'+getInitials(log.user_name)+'</div>'
        +'<div class="activity-icon">'+icon+'</div>'
        +'<div class="activity-body">'
          +'<div class="atext"><strong style="color:var(--text)">'+log.user_name+'</strong> '+label+' <span class="atarget">'+(log.target_name||'')+meta+'</span></div>'
          +'<div class="atime">'+formatDate(new Date(log.created_at).getTime())+'</div>'
        +'</div>'
      +'</div>';
    }).join('');
  } catch(e){ el.innerHTML='<div style="color:var(--red);padding:20px">Error: '+e.message+'</div>'; }
}

// ════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════
function loadSettingsPage() {
  const u=state.currentUser; if(!u) return;
  if($id('settingName'))  $id('settingName').value=u.name||'';
  if($id('settingEmail')) $id('settingEmail').value=u.email||'';
  if($id('settingRole'))  $id('settingRole').value=u.role||'';
}
async function saveSettings() {
  const name=$id('settingName').value.trim(), role=$id('settingRole').value.trim();
  try {
    const d=await api('PUT','/auth/profile',{name,role});
    state.currentUser={...state.currentUser,...d.user};
    updateSidebarUser();
    toast('រក្សាទុករួចហើយ!','success');
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// MODAL HELPERS + TOAST
// ════════════════════════════════════════════════════════
function closeModal(id){ $id(id)?.classList.remove('open'); }

function toast(msg,type='info') {
  const el=document.createElement('div');
  el.className='toast '+type; el.textContent=msg;
  $id('toastContainer').appendChild(el);
  setTimeout(()=>el.remove(),3500);
}

// ════════════════════════════════════════════════════════
// CHANGE PASSWORD (settings)
// ════════════════════════════════════════════════════════
async function changePassword() {
  const cur=$id('curPassword')?.value, nw=$id('newPwdSetting')?.value;
  if(!cur||!nw){ toast('សូមបំពេញទាំងពីរ','error'); return; }
  if(nw.length<6){ toast('ពាក្យសម្ងាត់ថ្មីយ៉ាងតិច 6 តួ','error'); return; }
  try {
    const d=await api('PUT','/auth/change-password',{currentPassword:cur,newPassword:nw});
    toast(d.message,'success');
    $id('curPassword').value=''; $id('newPwdSetting').value='';
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════════════
async function loadPendingCount() {
  try {
    const d=await api('GET','/auth/pending');
    const n=(d.users||[]).length;
    setText('pendingCount', n);
    const badge=$id('adminBadge');
    if(badge){ badge.textContent=n>0?n:''; badge.style.display=n>0?'inline':'none'; }
  } catch(_){}
}

let adminCurrentTab='pending';

function showAdminTab(tab) {
  adminCurrentTab=tab;
  $id('adminPendingList').style.display = tab==='pending'?'block':'none';
  $id('adminAllList').style.display     = tab==='all'?'block':'none';
  $id('adminTabPending').style.fontWeight = tab==='pending'?'700':'400';
  $id('adminTabAll').style.fontWeight     = tab==='all'?'700':'400';
}

async function renderAdminPage() {
  showAdminTab(adminCurrentTab);
  await loadPendingUsers();
  if(adminCurrentTab==='all') await loadAllUsers();
}

async function loadPendingUsers() {
  const el=$id('adminPendingList'); if(!el) return;
  el.innerHTML='<div style="color:var(--text3);padding:16px;font-size:13px">⏳ Loading...</div>';
  try {
    const d=await api('GET','/auth/pending');
    const users=d.users||[];
    setText('pendingCount',users.length);
    if(!users.length){
      el.innerHTML='<div class="empty-state"><div class="ei"></div><h3>មិនមានការស្នើ</h3><p>គ្មានការស្នើចូលប្រើ</p></div>';
      return;
    }
    el.innerHTML=users.map(u=>`
      <div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:10px">
        <div style="width:42px;height:42px;border-radius:10px;background:${u.avatar_color||'var(--accent)'};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0">${getInitials(u.name)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600">${u.name}</div>
          <div style="font-size:12px;color:var(--text3)">${u.email}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">ស្នើ ${formatDate(new Date(u.created_at).getTime())}</div>
        </div>
        <div style="display:flex;gap:7px;flex-shrink:0">
          <button class="btn btn-green btn-sm" onclick="adminAction('${u.id}','approve')">អនុម័ត</button>
          <button class="btn btn-danger btn-sm" onclick="adminAction('${u.id}','reject')">បដិសេធ</button>
        </div>
      </div>`).join('');
  } catch(e){
    el.innerHTML='<div style="color:var(--red);padding:16px">Error: '+e.message+'</div>';
  }
}

async function loadAllUsers() {
  const el=$id('adminAllList'); if(!el) return;
  el.innerHTML='<div style="color:var(--text3);padding:16px;font-size:13px">⏳ Loading...</div>';
  try {
    const d=await api('GET','/auth/users');
    const users=d.users||[];
    const statusColors={active:'var(--accent3)',pending:'var(--gold)',suspended:'var(--red)'};
    const statusLabel={active:'Active',pending:'Pending',suspended:'Suspended'};
    el.innerHTML=`
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="color:var(--text3);text-align:left;border-bottom:1px solid var(--border)">
          <th style="padding:10px 12px">ឈ្មោះ</th>
          <th style="padding:10px 12px">អ៊ីមែល</th>
          <th style="padding:10px 12px">Role</th>
          <th style="padding:10px 12px">Status</th>
          <th style="padding:10px 12px">Email ✓</th>
          <th style="padding:10px 12px">សកម្មភាព</th>
        </tr></thead>
        <tbody>${users.map(u=>`
          <tr style="border-bottom:1px solid var(--border)">
            <td style="padding:10px 12px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:28px;height:28px;border-radius:7px;background:${u.avatar_color||'var(--accent)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">${getInitials(u.name)}</div>
                ${u.name}
              </div>
            </td>
            <td style="padding:10px 12px;color:var(--text2)">${u.email}</td>
            <td style="padding:10px 12px"><span style="background:rgba(79,142,247,.15);color:var(--accent2);padding:2px 8px;border-radius:5px;font-size:11px;font-weight:600">${u.role}</span></td>
            <td style="padding:10px 12px"><span style="color:${statusColors[u.status]||'var(--text3)'};font-size:12px;font-weight:600">${statusLabel[u.status]||u.status}</span></td>
            <td style="padding:10px 12px;text-align:center">${u.email_verified?'✅':'❌'}</td>
            <td style="padding:10px 12px">
              <div style="display:flex;gap:5px">
                ${u.status!=='active'?`<button class="btn btn-green btn-sm" style="padding:4px 10px;font-size:11px" onclick="adminAction('${u.id}','approve')">✅</button>`:''}
                ${u.status==='active'?`<button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:11px" onclick="adminAction('${u.id}','suspend')">🚫</button>`:''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
      </div>`;
  } catch(e){
    el.innerHTML='<div style="color:var(--red);padding:16px">Error: '+e.message+'</div>';
  }
}

async function adminAction(userId, action) {
  const labels={approve:'អនុម័ត',reject:'បដិសេធ',suspend:'ផ្អាក'};
  if(!confirm(labels[action]+' user នេះ?')) return;
  try {
    await api('PUT','/auth/approve/'+userId,{action});
    toast('✅ '+labels[action]+' ជោគជ័យ!','success');
    loadPendingCount();
    renderAdminPage();
  } catch(e){ toast(e.message,'error'); }
}

// ════════════════════════════════════════════════════════
// FILE RENAME
// ════════════════════════════════════════════════════════
function openRenameFileModal(fileId, fileName) {
  const dotIdx = fileName.lastIndexOf('.');
  const nameOnly = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
  const ext      = dotIdx > 0 ? fileName.slice(dotIdx)    : '';
  $id('renameFileId').value       = fileId;
  $id('renameFileExt').value      = ext;
  $id('renameFileInput').value    = nameOnly;
  $id('renameFileOldName').textContent = fileName;
  $id('renameFileModal').classList.add('open');
  setTimeout(() => {
    const inp = $id('renameFileInput');
    inp.focus();
    inp.select();
  }, 120);
}
 
async function doRenameFile() {
  const fileId  = $id('renameFileId').value;
  const ext     = $id('renameFileExt').value;
  const newBase = $id('renameFileInput').value.trim();
  if (!newBase) { toast('សូមវាយឈ្មោះថ្មី','error'); return; }
 
  // Rebuild full name with original extension
  const newName = newBase + ext;
 
  // Check duplicate in current folder/team
  const duplicate = state.files.find(f =>
    f.id !== fileId &&
    f.name.toLowerCase() === newName.toLowerCase() &&
    f.folderId === (state.files.find(x => x.id === fileId)?.folderId || null)
  );
  if (duplicate) {
    toast('⚠️ "' + newName + '" មានហើយ — សូមប្ដូរឈ្មោះផ្សេង','error');
    return;
  }
 
  try {
    await api('PUT', '/files/' + fileId + '/rename', { name: newName });
    // Update local state
    const f = state.files.find(x => x.id === fileId);
    if (f) f.name = newName;
    closeModal('renameFileModal');
    toast('✅ ប្ដូរឈ្មោះ → "' + newName + '"','success');
    renderCurrentPage();
  } catch(e) { toast(e.message,'error'); }
}
 
// ════════════════════════════════════════════════════════
// UPLOAD DEDUPLICATION
// ════════════════════════════════════════════════════════
// Generates a unique name if the same name already exists in the target folder
function resolveUploadName(desiredName, existingFiles) {
  const names = new Set(existingFiles.map(f => f.name.toLowerCase()));
  if (!names.has(desiredName.toLowerCase())) return desiredName;
 
  const dotIdx   = desiredName.lastIndexOf('.');
  const base     = dotIdx > 0 ? desiredName.slice(0, dotIdx) : desiredName;
  const ext      = dotIdx > 0 ? desiredName.slice(dotIdx)    : '';
  let counter    = 1;
  let candidate  = base + ' (' + counter + ')' + ext;
 
  while (names.has(candidate.toLowerCase())) {
    counter++;
    candidate = base + ' (' + counter + ')' + ext;
  }
  return candidate;
}
 
// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
window.addEventListener('load', checkSession);