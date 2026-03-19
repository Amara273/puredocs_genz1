
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// CONFIG — change this to your backend URL
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api'; // Same-origin on Render.com
 
// ── API helper ──────────────────────────────
async function api(method, path, body = null, isFormData = false) {
  const token = localStorage.getItem('tdkh_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';
 
  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
 
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({ success: false, message: 'Server error' }));
  if (!res.ok && !data.success) throw new Error(data.message || 'Request failed');
  return data;
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// STATE
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

let state = {
  currentUser: null,
  teams: [],
  files: [],
  currentTeamId: null,
  selectedFiles: new Set(),
  currentPage: 'dashboard'
};
 
const COLORS = [
  'linear-gradient(135deg,#4f8ef7,#38d9a9)',
  'linear-gradient(135deg,#f5c842,#ff8c42)',
  'linear-gradient(135deg,#b46fff,#4f8ef7)',
  'linear-gradient(135deg,#ff6b6b,#ffa07a)',
  'linear-gradient(135deg,#38d9a9,#4fc3f7)',
  'linear-gradient(135deg,#f5c842,#e879a0)',
];
 
const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️',
  zip: '📦', rar: '📦', ppt: '📊', pptx: '📊',
  txt: '📃', mp4: '🎬', mp3: '🎵',
};
 
function getFileType(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc','docx','txt'].includes(ext)) return 'doc';
  if (['xls','xlsx','csv'].includes(ext)) return 'xls';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'img';
  if (['zip','rar','7z'].includes(ext)) return 'zip';
  return 'other';
}
 
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
}
 
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}
 
function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'ម្តឹងនេះ';
  if (diff < 3600) return Math.floor(diff/60) + ' នាទីមុន';
  if (diff < 86400) return Math.floor(diff/3600) + ' ម៉ោងមុន';
  return d.toLocaleDateString('km-KH');
}
 
function getInitials(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// TOKEN HELPERS
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function saveToken(token) { localStorage.setItem('tdkh_token', token); }
function clearToken()     { localStorage.removeItem('tdkh_token'); }
function getToken()       { return localStorage.getItem('tdkh_token'); }
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// AUTH
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}
 
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  if (!email || !pass) { toast('សូមបំពេញ Email និង Password', 'error'); return; }
  setLoading('loginBtn', true, 'កំពុងចូល...');
  try {
    const data = await api('POST', '/auth/login', { email, password: pass });
    saveToken(data.token);
    loginSuccess(data.user, data.teams);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading('loginBtn', false, '🔐 ចូលប្រើប្រាស់');
  }
}
 
async function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const pass     = document.getElementById('regPass').value;
  const teamCode = document.getElementById('regTeam').value.trim();
  if (!name || !email || !pass) { toast('សូមបំពេញគ្រប់ព័ត៌មាន', 'error'); return; }
  setLoading('registerBtn', true, 'កំពុងចុះឈ្មោះ...');
  try {
    const data = await api('POST', '/auth/register', { name, email, password: pass, teamCode });
    saveToken(data.token);
    loginSuccess(data.user, data.team ? [data.team] : []);
    toast('ចុះឈ្មោះជោគជ័យ! 🎉', 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading('registerBtn', false, '✅ ចុះឈ្មោះចូលក្រុម');
  }
}
 
function loginSuccess(user, teams = []) {
  state.currentUser = user;
  state.teams = Array.isArray(teams) ? teams : [teams];
  state.currentTeamId = state.teams.length > 0 ? state.teams[0].id : null;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  updateSidebarUser();
  updateSidebarTeam();
  renderDashboard();
  toast('សូមស្វាគមន៍, ' + user.name + '! 👋', 'success');
}
 
function doLogout() {
  clearToken();
  state.currentUser = null;
  state.teams = [];
  state.files = [];
  state.currentTeamId = null;
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  clearSelection();
}
 
async function checkSession() {
  const token = getToken();
  if (!token) { document.getElementById('authScreen').style.display = 'flex'; return; }
  try {
    const data = await api('GET', '/auth/me');
    loginSuccess(data.user, data.teams);
  } catch (err) {
    clearToken();
    document.getElementById('authScreen').style.display = 'flex';
  }
}
 
function setLoading(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = loading; btn.textContent = label; }
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// NAVIGATION
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navMap = { dashboard: 0, files: 1, shared: 2, mine: 3, upload: 4, members: 6, settings: 7 };
  const items = document.querySelectorAll('.nav-item');
  if (navMap[name] !== undefined && items[navMap[name]]) items[navMap[name]].classList.add('active');
  state.currentPage = name;
  closeSidebar();
 
  if (name === 'files') renderFilesPage();
  else if (name === 'shared') renderSharedPage();
  else if (name === 'mine') renderMinePage();
  else if (name === 'members') renderMembersPage();
  else if (name === 'dashboard') renderDashboard();
  else if (name === 'settings') loadSettings();
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// SIDEBAR
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function updateSidebarUser() {
  const u = state.currentUser;
  if (!u) return;
  document.getElementById('sidebarAvatar').textContent = getInitials(u.name);
  document.getElementById('sidebarAvatar').style.background = u.color || COLORS[0];
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarRole').textContent = u.role || 'Member';
}
 
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  document.getElementById('sidebarTeamCount').textContent = team.members.length + ' នាក់';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlayBg').classList.toggle('show');
}
 
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlayBg').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// FILE RENDERING
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// Map API file fields to display fields
function normalizeFile(f) {
  return {
    id:         f.id,
    name:       f.original_name || f.name,
    size:       f.size,
    teamId:     f.team_id || f.teamId,
    uploaderId: f.uploader_id || f.uploaderId,
    uploaderName: f.uploader_name || '',
    uploadedAt: f.upload_date ? new Date(f.upload_date).getTime() : (f.uploadedAt || Date.now()),
    shared:     !!f.is_shared,
    shareToken: f.share_token || null,
  };
}
 
function renderFilesGrid(containerId, files, showTags) {
  const container = document.getElementById(containerId);
  if (!files.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">📭</div>
      <h3>មិនមានឯកសារ</h3>
      <p>ចុច "បញ្ចូលឯកសារ" ដើម្បីចាប់ផ្តើម</p>
    </div>`;
    return;
  }
  container.innerHTML = files.map(file => {
    const type = getFileType(file.name);
    const icon = getFileIcon(file.name);
    const isSelected = state.selectedFiles.has(file.id);
    const isNew = (Date.now() - file.uploadedAt) < 3600000;
    const isMine = file.uploaderId === state.currentUser?.id;
    const tags = showTags ? `
      ${isNew ? '<span class="file-tag tag-new">✨ ថ្មី</span>' : ''}
      ${file.shared ? '<span class="file-tag tag-shared">🔗 ចែករំលែក</span>' : ''}
      ${isMine ? '<span class="file-tag tag-mine">⭐ របស់ខ្ញុំ</span>' : ''}
    ` : '';
    return `<div class="file-card ${isSelected ? 'selected' : ''}" id="fc-${file.id}" onclick="toggleFileSelect('${file.id}')">
      <div class="select-check">✓</div>
      <div class="file-icon-wrap ${type}">${icon}</div>
      <div class="file-name">${file.name}</div>
      <div class="file-meta">
        <span>${formatSize(file.size)}</span>
        <span class="dot">·</span>
        <span>${formatDate(file.uploadedAt)}</span>
        ${file.uploaderName ? `<span class="dot">·</span><span>${file.uploaderName}</span>` : ''}
      </div>
      ${tags}
      <div class="file-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="downloadFile('${file.id}')" title="ទាញ">⬇️</button>
        <button class="btn btn-green btn-sm btn-icon" onclick="shareFile('${file.id}')" title="ចែករំលែក">🔗</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFile('${file.id}')" title="លុប">🗑️</button>
      </div>
    </div>`;
  }).join('');
}
 
async function loadFiles() {
  if (!state.currentTeamId) return;
  try {
    const data = await api('GET', `/files?teamId=${state.currentTeamId}`);
    state.files = (data.files || []).map(normalizeFile);
    updateBadge();
  } catch (err) {
    console.error('loadFiles:', err.message);
  }
}
 
function updateBadge() {
  document.getElementById('navBadgeFiles').textContent = state.files.length;
}
 
async function renderDashboard() {
  await loadFiles();
  const files    = state.files;
  const shared   = files.filter(f => f.shared);
  const mine     = files.filter(f => f.uploaderId === state.currentUser?.id);
  const team     = state.teams.find(t => t.id === state.currentTeamId);
 
  document.getElementById('statTotal').textContent   = files.length;
  document.getElementById('statShared').textContent  = shared.length;
  document.getElementById('statMine').textContent    = mine.length;
 
  // Member count from API
  try {
    const mdata = await api('GET', `/teams/${state.currentTeamId}/members`);
    document.getElementById('statMembers').textContent = (mdata.members || []).length;
  } catch(_) {}
 
  document.getElementById('dashWelcome').textContent =
    (state.currentUser?.name || '') + ' | ' + (team?.name || '') + ' · ' + new Date().toLocaleDateString('km-KH');
 
  const recent = [...files].sort((a,b) => b.uploadedAt - a.uploadedAt).slice(0, 6);
  renderFilesGrid('recentFilesGrid', recent, true);
}
 
async function renderFilesPage() {
  await loadFiles();
  filterFiles();
}
 
function filterFiles() {
  let files = [...state.files];
  const search = (document.getElementById('searchFiles')?.value || '').toLowerCase();
  const type   = document.getElementById('filterType')?.value  || '';
  const sort   = document.getElementById('filterSort')?.value  || 'newest';
 
  if (search) files = files.filter(f => f.name.toLowerCase().includes(search));
  if (type)   files = files.filter(f => getFileType(f.name) === type);
  if (sort === 'newest') files.sort((a,b) => b.uploadedAt - a.uploadedAt);
  else if (sort === 'oldest') files.sort((a,b) => a.uploadedAt - b.uploadedAt);
  else if (sort === 'name')   files.sort((a,b) => a.name.localeCompare(b.name));
 
  renderFilesGrid('allFilesGrid', files, true);
}
 
async function renderSharedPage() {
  await loadFiles();
  renderFilesGrid('sharedFilesGrid', state.files.filter(f => f.shared), false);
}
 
async function renderMinePage() {
  await loadFiles();
  renderFilesGrid('myFilesGrid', state.files.filter(f => f.uploaderId === state.currentUser?.id), false);
}
 
async function renderMembersPage() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  document.getElementById('memberPageSub').textContent = team?.name || '';
  const statuses = ['online','online','away','offline','online','online'];
  try {
    const data = await api('GET', `/teams/${state.currentTeamId}/members`);
    const members = data.members || [];
    document.getElementById('membersGrid').innerHTML = members.length ? members.map((m, i) => `
      <div class="member-card">
        <div class="member-avatar" style="background:${m.avatar_color || COLORS[i%COLORS.length]}">${getInitials(m.name)}</div>
        <div class="member-info">
          <div class="name">${m.name}</div>
          <div class="role">${m.role || 'member'} · ${m.email}</div>
          <div class="status">
            <div class="status-dot ${statuses[i%statuses.length]}"></div>
            <span style="color:var(--text3)">${statuses[i%statuses.length]==='online'?'អនឡាញ':statuses[i%statuses.length]==='away'?'ស្ថានការណ៍ផ្សេង':'ក្រៅបណ្តាញ'}</span>
          </div>
        </div>
      </div>
    `).join('') : '<div class="empty-state" style="grid-column:1/-1"><div class="icon">👥</div><h3>មិនមានសមាជិក</h3></div>';
  } catch(err) {
    toast('មិនអាចទាញយកសមាជិក: ' + err.message, 'error');
  }
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// FILE SELECTION
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function toggleFileSelect(id) {
  if (state.selectedFiles.has(id)) state.selectedFiles.delete(id);
  else state.selectedFiles.add(id);
  const card = document.getElementById('fc-' + id);
  if (card) card.classList.toggle('selected', state.selectedFiles.has(id));
  const count = state.selectedFiles.size;
  const bar = document.getElementById('selectionBar');
  bar.classList.toggle('show', count > 0);
  document.getElementById('selectionCount').textContent = count + ' ឯកសារ';
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// FILE ACTIONS
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function downloadFile(id) {
  window.open(`${API_BASE}/files/${id}/download`, '_blank');
}
 
function shareFile(id) {
  state.selectedFiles.add(id);
  openShareModal();
}
 
async function deleteFile(id) {
  if (!confirm('លុបឯកសារនេះ?')) return;
  try {
    await api('DELETE', `/files/${id}`);
    state.files = state.files.filter(f => f.id !== id);
    toast('🗑️ ឯកសារត្រូវបានលុប', 'success');
    renderCurrentPage();
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
async function deleteSelected() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  if (!confirm(`លុប ${ids.length} ឯកសារ?`)) return;
  try {
    await Promise.all(ids.map(id => api('DELETE', `/files/${id}`)));
    state.files = state.files.filter(f => !state.selectedFiles.has(f.id));
    clearSelection();
    toast(`🗑️ លុប ${ids.length} ឯកសារ`, 'success');
    renderCurrentPage();
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
function renderCurrentPage() {
  if (state.currentPage === 'files') renderFilesPage();
  else if (state.currentPage === 'shared') renderSharedPage();
  else if (state.currentPage === 'mine') renderMinePage();
  else if (state.currentPage === 'dashboard') renderDashboard();
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// FILE UPLOAD  (real API)
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function handleDragOver(e)  { e.preventDefault(); document.getElementById('uploadZone').classList.add('drag-over'); }
function handleDragLeave(e) { document.getElementById('uploadZone').classList.remove('drag-over'); }
function handleDrop(e)      { e.preventDefault(); document.getElementById('uploadZone').classList.remove('drag-over'); processUpload(Array.from(e.dataTransfer.files)); }
function handleFileSelect(e){ processUpload(Array.from(e.target.files)); }
 
async function processUpload(files) {
  if (!files.length) return;
  if (!state.currentTeamId) { toast('ជ្រើសក្រុមជាមុន', 'error'); return; }
 
  const progressWrap = document.getElementById('uploadProgress');
  const progressBar  = document.getElementById('uploadBar');
  progressWrap.style.display = 'block';
  progressBar.style.width = '10%';
 
  try {
    const formData = new FormData();
    formData.append('teamId', state.currentTeamId);
    files.forEach(f => formData.append('files', f));
 
    // Fake progress animation while uploading
    let fakeProgress = 10;
    const ticker = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + Math.random() * 10, 85);
      progressBar.style.width = fakeProgress + '%';
    }, 200);
 
    const data = await api('POST', '/files/upload', formData, true);
    clearInterval(ticker);
    progressBar.style.width = '100%';
 
    setTimeout(() => { progressWrap.style.display = 'none'; progressBar.style.width = '0%'; }, 600);
 
    const newFiles = (data.files || []).map(normalizeFile);
    state.files = [...newFiles, ...state.files];
    toast(`✅ បញ្ចូល ${newFiles.length} ឯកសារ ជោគជ័យ!`, 'success');
    renderPreviewList();
    updateBadge();
 
  } catch(err) {
    progressWrap.style.display = 'none';
    progressBar.style.width = '0%';
    toast('Upload failed: ' + err.message, 'error');
  }
}
 
function renderPreviewList() {
  const recent = [...state.files].sort((a,b) => b.uploadedAt - a.uploadedAt).slice(0, 5);
  document.getElementById('uploadPreviewList').innerHTML = recent.length ? `
    <h3 style="font-size:14px; font-weight:600; color:var(--text2); margin-bottom:12px">ឯកសារចុងក្រោយ</h3>
    ${recent.map(f => `
      <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--card); border:1px solid var(--border); border-radius:10px; margin-bottom:8px;">
        <span style="font-size:24px">${getFileIcon(f.name)}</span>
        <div style="flex:1; min-width:0">
          <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${f.name}</div>
          <div style="font-size:12px; color:var(--text3)">${formatSize(f.size)} · ${formatDate(f.uploadedAt)}</div>
        </div>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="downloadFile('${f.id}')">⬇️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteFile('${f.id}')">🗑️</button>
      </div>
    `).join('')}
  ` : '';
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// SHARE  (real API)
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function openShareModal() {
  const count = state.selectedFiles.size;
  if (count === 0) { toast('ជ្រើសឯកសារជាមុនសិន', 'error'); return; }
 
  // Show selected file names in modal
  const names = [...state.selectedFiles].map(id => {
    const f = state.files.find(x => x.id === id);
    return f ? f.name : id;
  });
  document.getElementById('shareModalDesc').textContent = count + ' ឯកសារ: ' + names.slice(0,2).join(', ') + (names.length > 2 ? '...' : '');
  document.getElementById('shareLinkInput').value = 'កំពុងបង្កើត...';
  document.getElementById('shareModal').classList.add('open');
  generateShareLink();
}
 
async function generateShareLink() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  try {
    const data = await api('POST', `/files/${ids[0]}/share`, { platform: null });
    document.getElementById('shareLinkInput').value = data.shareUrl || '';
  } catch(err) {
    document.getElementById('shareLinkInput').value = 'Error: ' + err.message;
  }
}
 
function closeShareModal() {
  document.getElementById('shareModal').classList.remove('open');
}
 
// ── Core: download file as Blob then trigger native share or save ──
async function fetchFileBlob(fileId) {
  const token = localStorage.getItem('tdkh_token');
  const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('ទាញឯកសារបរាជ័យ');
  const blob = await res.blob();
  const file = state.files.find(f => f.id === fileId);
  const filename = file?.name || 'file';
  return new File([blob], filename, { type: blob.type });
}
 
async function shareTo(platform) {
  if (state.selectedFiles.size === 0) { toast('ជ្រើសឯកសារជាមុនសិន', 'error'); return; }
 
  const ids = [...state.selectedFiles];
 
  // ── Telegram, Zalo, Facebook: use Web Share API to share real files ──
  if ((platform === 'telegram' || platform === 'zalo' || platform === 'facebook') && navigator.share) {
    try {
      toast('⏳ កំពុងត្រៀម...', 'info');
      const fileObjects = await Promise.all(ids.map(id => fetchFileBlob(id)));
 
      // Check if browser supports sharing files
      if (navigator.canShare && navigator.canShare({ files: fileObjects })) {
        await navigator.share({
          title: 'ឯកសារពី TeamDocs KH',
          text: 'ចែករំលែកឯកសារ ' + fileObjects.map(f => f.name).join(', '),
          files: fileObjects,
        });
        toast('✅ ចែករំលែកជោគជ័យ!', 'success');
      } else {
        // File sharing not supported — fall back to link sharing
        await shareViaLink(platform, ids);
      }
    } catch(err) {
      if (err.name !== 'AbortError') {
        // User cancelled or error — fallback to link
        await shareViaLink(platform, ids);
      }
    }
 
  } else if (platform === 'email') {
    // Email: download files + open mailto with filenames listed
    try {
      toast('⏳ កំពុងត្រៀម...', 'info');
      const fileObjects = await Promise.all(ids.map(id => fetchFileBlob(id)));
 
      // Download all files first
      fileObjects.forEach(file => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      });
 
      // Open email with file names listed
      const subject = encodeURIComponent('ចែករំលែកឯកសារពី TeamDocs KH');
      const body = encodeURIComponent(
        'សូមជម្រាបជូន,ខ្ញុំសូមចែករំលែកឯកសារទាំងនេះ:' +
        fileObjects.map(f => '• ' + f.name).join('') +
        '(ឯកសារត្រូវបានទាញយករួចហើយ សូម attach ក្នុង email) TeamDocs KH'
      );
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
      toast('✅ ឯកសារទាញជោគជ័យ! សូម attach ក្នុង email', 'success');
    } catch(err) {
      toast('Email error: ' + err.message, 'error');
    }
 
  } else if (platform === 'link') {
    await shareViaLink('link', ids);
 
  } else {
    // Fallback for unsupported platforms
    await shareViaLink(platform, ids);
  }
 
  // Mark files as shared in DB
  try {
    await Promise.all(ids.map(id => api('POST', `/files/${id}/share`, { platform })));
    ids.forEach(id => {
      const f = state.files.find(x => x.id === id);
      if (f) f.shared = true;
    });
  } catch(_) {}
 
  closeShareModal();
  clearSelection();
  renderCurrentPage();
}
 
// ── Fallback: share download link via platform ──
async function shareViaLink(platform, ids) {
  try {
    const data = await api('POST', `/files/${ids[0]}/share`, { platform });
    const link = data.shareUrl || '';
    let url = '#';
    if (platform === 'telegram') url = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('ឯកសារពី TeamDocs KH');
    else if (platform === 'facebook') url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link);
    else if (platform === 'zalo') url = 'https://zalo.me/share?href=' + encodeURIComponent(link);
    else if (platform === 'email') url = 'mailto:?subject=' + encodeURIComponent('ចែករំលែកឯកសារ') + '&body=' + encodeURIComponent(link);
    if (url !== '#') window.open(url, '_blank');
    toast('✅ ចែករំលែក link ជោគជ័យ!', 'success');
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
async function copyShareLink() {
  const ids = [...state.selectedFiles];
  try {
    let textToCopy = '';
    if (ids.length > 0) {
      const data = await api('POST', `/files/${ids[0]}/share`, {});
      textToCopy = data.shareUrl || '';
    } else {
      textToCopy = document.getElementById('shareLinkInput').value;
    }
    await navigator.clipboard.writeText(textToCopy);
    toast('✅ ចម្លងតំណរ ជោគជ័យ!', 'success');
  } catch(err) {
    toast('⚠️ ចម្លងបរាជ័យ', 'error');
  }
  closeShareModal();
}
 
async function downloadSelected() {
  const ids = [...state.selectedFiles];
  if (!ids.length) return;
  toast('⏳ កំពុងទាញ ' + ids.length + ' ឯកសារ...', 'info');
  try {
    for (const id of ids) {
      const file = await fetchFileBlob(id);
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await new Promise(r => setTimeout(r, 300)); // small delay between files
    }
    toast('✅ ទាញ ' + ids.length + ' ឯកសារ ជោគជ័យ!', 'success');
  } catch(err) {
    toast('Download error: ' + err.message, 'error');
  }
  closeShareModal();
  clearSelection();
}
 
async function openTeamModal() {
  try {
    const data = await api('GET', '/teams');
    state.teams = data.teams || [];
  } catch(_) {}
  document.getElementById('teamList').innerHTML = state.teams.map(team => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px; background:${team.id===state.currentTeamId?'rgba(79,142,247,0.1)':'var(--bg2)'}; border:1px solid ${team.id===state.currentTeamId?'var(--accent)':'var(--border)'}; border-radius:10px; cursor:pointer; transition:all 0.2s" onclick="switchTeam('${team.id}')">
      <div class="team-avatar" style="background:${team.color || COLORS[0]};width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">${getInitials(team.name)}</div>
      <div style="flex:1">
        <div style="font-size:14px; font-weight:600">${team.name}</div>
        <div style="font-size:12px; color:var(--text3)">${team.member_count || '?'} នាក់ · ${team.code}</div>
      </div>
      ${team.id===state.currentTeamId?'<span style="color:var(--accent3)">✓</span>':''}
    </div>
  `).join('') || '<p style="color:var(--text3); font-size:13px">មិនមានក្រុម</p>';
  document.getElementById('teamModal').classList.add('open');
}
 
function switchTeam(teamId) {
  state.currentTeamId = teamId;
  state.files = [];
  updateSidebarTeam();
  closeModal('teamModal');
  renderDashboard();
  toast('✅ ប្តូរទៅ ' + (state.teams.find(t=>t.id===teamId)?.name), 'success');
}
 
async function createTeam() {
  const name = document.getElementById('newTeamName').value.trim();
  if (!name) { toast('សូមវាយឈ្មោះក្រុម', 'error'); return; }
  try {
    const data = await api('POST', '/teams', { name });
    state.teams.push(data.team);
    document.getElementById('newTeamName').value = '';
    switchTeam(data.team.id);
    toast('✅ បង្កើតក្រុម ' + name + ' ជោគជ័យ!', 'success');
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// INVITE
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function openInviteModal() {
  document.getElementById('inviteModal').classList.add('open');
}
 
async function sendInvite() {
  const email = document.getElementById('inviteEmail').value.trim();
  const role  = document.getElementById('inviteRole').value;
  if (!email) { toast('សូមបញ្ចូលអ៊ីមែល', 'error'); return; }
  try {
    const data = await api('POST', `/teams/${state.currentTeamId}/invite`, { email, role });
    toast('📨 ' + data.message, 'success');
    document.getElementById('inviteEmail').value = '';
    closeModal('inviteModal');
    renderMembersPage();
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// SETTINGS
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function loadSettings() {
  const u = state.currentUser;
  if (!u) return;
  document.getElementById('settingName').value  = u.name  || '';
  document.getElementById('settingEmail').value = u.email || '';
  document.getElementById('settingRole').value  = u.role  || '';
}
 
async function saveSettings() {
  const name = document.getElementById('settingName').value.trim();
  const role = document.getElementById('settingRole').value.trim();
  try {
    const data = await api('PUT', '/auth/profile', { name, role });
    state.currentUser = { ...state.currentUser, ...data.user };
    updateSidebarUser();
    toast('💾 រក្សាទុករួចហើយ!', 'success');
  } catch(err) {
    toast(err.message, 'error');
  }
}
 
function confirmClearData() {
  if (confirm('⚠️ ចាកចេញពីគណនី?')) {
    doLogout();
  }
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// MODAL HELPERS
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

// TOAST
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
 
// ═══════════════════════════════════════════
// SELECTION HELPERS
// ═══════════════════════════════════════════
function clearSelection() {
  state.selectedFiles.forEach(id => {
    const card = document.getElementById('fc-' + id);
    if (card) card.classList.remove('selected');
  });
  state.selectedFiles.clear();
  document.getElementById('selectionBar').classList.remove('show');
}
 
// ═══════════════════════════════════════════
// SIDEBAR TEAM  — handle both member_count and members[]
// ═══════════════════════════════════════════
function updateSidebarTeam() {
  const team = state.teams.find(t => t.id === state.currentTeamId);
  if (!team) return;
  document.getElementById('sidebarTeamName').textContent = team.name;
  const cnt = team.member_count ?? (Array.isArray(team.members) ? team.members.length : '?');
  document.getElementById('sidebarTeamCount').textContent = cnt + ' នាក';
  document.getElementById('sidebarTeamAvatar').textContent = getInitials(team.name);
  document.getElementById('sidebarTeamAvatar').style.background = team.color || COLORS[0];
}
 
// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
window.addEventListener('load', checkSession);