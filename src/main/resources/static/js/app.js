/**
 * AuraEdu Student Management System - Frontend Core Application
 * Connects seamlessly to Spring Boot REST APIs with JWT Authentication
 */

// Configuration: uses current host or defaults to http://localhost:8080 if served separately
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? (window.location.port === '8080' ? '' : 'http://localhost:8080')
  : '';

// Application State
const state = {
  token: localStorage.getItem('aura_jwt_token') || '',
  user: JSON.parse(localStorage.getItem('aura_user') || 'null'),
  students: [],
  courses: [],
  activeTab: 'dashboard',
  currentCourseFilter: 'ALL',
  searchQuery: '',
  studentSortBy: 'id_asc',
  studentViewMode: 'table', // 'table' or 'grid'
  backendOnline: false,
  deleteTarget: null // { type: 'student'|'course', id, name }
};

// Fallback Demo Data for instant UI preview if backend is loading
const demoData = {
  courses: [
    { id: 1, courseName: 'Java', duration: '6 Months' },
    { id: 2, courseName: 'DSA', duration: '3 Months' },
    { id: 3, courseName: 'React', duration: '4 Months' },
    { id: 4, courseName: 'Spring Boot', duration: '5 Months' }
  ],
  students: [
    { id: 1, name: 'IRAm', email: 'syeedarham.in@gmail.com', course: [{ id: 2, courseName: 'DSA', duration: '3 Months' }] },
    { id: 2, name: 'Arham', email: 'arham@gmail.com', course: [{ id: 1, courseName: 'Java' }, { id: 2, courseName: 'DSA' }] },
    { id: 3, name: 'Rahul', email: 'rahul@gmail.com', course: [{ id: 1, courseName: 'Java' }, { id: 3, courseName: 'React' }] },
    { id: 4, name: 'Amit', email: 'amit@gmail.com', course: [{ id: 2, courseName: 'DSA' }, { id: 4, courseName: 'Spring Boot' }] }
  ]
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavigation();
  setupEventListeners();
  updateAuthUI();
  checkBackendAndFetchData();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('aura_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('aura_theme', next);
  updateThemeIcon(next);
  showToast('Theme Changed', `Switched to ${next} mode`, 'info');
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

// Navigation Tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.dataset.tab;
      if (!targetTab) return;
      switchTab(targetTab);
      // Close mobile sidebar if open
      document.querySelector('.app-sidebar')?.classList.remove('mobile-open');
    });
  });

  // Mobile menu toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.querySelector('.app-sidebar')?.classList.toggle('mobile-open');
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  document.querySelectorAll('.view-section').forEach(el => {
    el.classList.remove('active-view');
  });

  const activeSection = document.getElementById(`view-${tabId}`);
  if (activeSection) {
    activeSection.classList.add('active-view');
  }

  // Update header title
  const titles = {
    dashboard: { title: 'Dashboard Overview', sub: 'Comprehensive metrics, quick analytics, and student overview' },
    students: { title: 'Students Directory', sub: 'Manage, search, and register academic student records' },
    courses: { title: 'Courses & Curriculum', sub: 'Explore available study programs, terms, and durations' },
    enrollment: { title: 'Course Enrollment Explorer', sub: 'Inspect student rosters enrolled per specific course' },
    security: { title: 'API & Security Hub', sub: 'JWT Authentication token manager and Spring REST endpoint status' }
  };
  const meta = titles[tabId] || titles.dashboard;
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.sub;

  if (tabId === 'students') renderStudents();
  if (tabId === 'courses') renderCourses();
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'enrollment') setupEnrollmentExplorer();
  if (tabId === 'security') renderSecurityHub();
}

// ==========================================================================
// API Client & Data Fetching
// ==========================================================================
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401 || res.status === 403) {
      if (state.token) {
        showToast('Session Expired', 'Please sign in again to continue', 'warning');
        handleLogout(false);
      }
      if (!options.silentAuth) {
        openAuthModal('signin');
      }
      throw new Error('Authentication required');
    }

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = errText;
      try {
        const json = JSON.parse(errText);
        errMsg = json.message || json.error || errText;
      } catch (e) {}
      throw new Error(errMsg || `Request failed with status ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

async function checkBackendAndFetchData() {
  updateConnectionBadge('checking');
  try {
    // Try fetching courses or students to verify backend connection
    const courses = await apiRequest('/Course/getAll', { method: 'GET', silentAuth: true });
    state.courses = Array.isArray(courses) ? courses : [];

    // Try fetching students
    if (state.token) {
      try {
        const students = await apiRequest('/Student/getAll', { method: 'GET', silentAuth: true });
        state.students = Array.isArray(students) ? students : [];
      } catch (e) {
        console.log('Students fetch needs auth or error:', e.message);
      }
    }

    state.backendOnline = true;
    updateConnectionBadge('online');
    showToast('Backend Connected', 'Spring Boot 8080 is online & connected to MySQL', 'success');
  } catch (err) {
    state.backendOnline = false;
    updateConnectionBadge('offline');
    console.warn('Backend unavailable, utilizing demo baseline:', err);
    state.courses = demoData.courses;
    state.students = demoData.students;
  }

  renderDashboard();
  renderStudents();
  renderCourses();
}

function updateConnectionBadge(status) {
  const badge = document.getElementById('backend-status-badge');
  const dot = document.getElementById('backend-status-dot');
  const text = document.getElementById('backend-status-text');
  if (!badge) return;

  if (status === 'online') {
    dot.style.background = '#10b981';
    dot.style.boxShadow = '0 0 10px #10b981';
    text.textContent = 'Backend Online (Port 8080)';
  } else if (status === 'offline') {
    dot.style.background = '#f59e0b';
    dot.style.boxShadow = '0 0 10px #f59e0b';
    text.textContent = 'Demo Mode (Offline)';
  } else {
    dot.style.background = '#6366f1';
    dot.style.boxShadow = '0 0 10px #6366f1';
    text.textContent = 'Connecting...';
  }
}

// ==========================================================================
// Authentication Handling
// ==========================================================================
function updateAuthUI() {
  const profileName = document.getElementById('user-profile-name');
  const profileStatus = document.getElementById('user-profile-status');
  const profileAvatar = document.getElementById('user-profile-avatar');
  const authBtn = document.getElementById('user-auth-btn');

  if (state.token && state.user) {
    if (profileName) profileName.textContent = state.user.name || state.user.email.split('@')[0];
    if (profileStatus) profileStatus.innerHTML = `<span class="status-dot"></span> Authenticated`;
    if (profileAvatar) {
      const initial = (state.user.name || state.user.email)[0].toUpperCase();
      profileAvatar.textContent = initial;
    }
    if (authBtn) {
      authBtn.title = 'Sign Out';
      authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
    }
  } else {
    if (profileName) profileName.textContent = 'Guest User';
    if (profileStatus) profileStatus.innerHTML = `<span class="status-dot" style="background:#94a3b8;box-shadow:none;"></span> Not Logged In`;
    if (profileAvatar) profileAvatar.textContent = '?';
    if (authBtn) {
      authBtn.title = 'Sign In';
      authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
    }
  }
}

async function handleLogin(email, password) {
  try {
    const token = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.token = typeof token === 'string' ? token.trim().replace(/^"|"$/g, '') : token;
    state.user = { email, name: email.split('@')[0] };
    localStorage.setItem('aura_jwt_token', state.token);
    localStorage.setItem('aura_user', JSON.stringify(state.user));

    updateAuthUI();
    closeModal('modal-auth');
    showToast('Welcome Back!', `Signed in successfully as ${email}`, 'success');

    // Fetch fresh authenticated data
    await refreshAllData();
  } catch (err) {
    showToast('Sign In Failed', err.message || 'Invalid email or password', 'error');
  }
}

async function handleRegister(name, email, password) {
  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    showToast('Account Created', 'Registration successful! Signing you in...', 'success');
    await handleLogin(email, password);
  } catch (err) {
    showToast('Registration Error', err.message || 'Could not register user', 'error');
  }
}

async function handleLogout(notify = true) {
  try {
    await apiRequest('/auth/logout', { method: 'POST', silentAuth: true });
  } catch (e) {}
  state.token = '';
  state.user = null;
  state.students = [];
  localStorage.removeItem('aura_jwt_token');
  localStorage.removeItem('aura_user');
  updateAuthUI();
  renderDashboard();
  renderStudents();
  openAuthModal('signin');
  if (notify) showToast('Signed Out', 'You have been signed out. Please sign in.', 'info');
}

async function refreshAllData() {
  try {
    const courses = await apiRequest('/Course/getAll', { method: 'GET', silentAuth: true });
    if (Array.isArray(courses)) {
      state.courses = courses;
      state.backendOnline = true;
      updateConnectionBadge('online');
    }

    if (state.token) {
      const students = await apiRequest('/Student/getAll', { method: 'GET', silentAuth: true });
      if (Array.isArray(students)) state.students = students;
    }

    renderDashboard();
    renderStudents();
    renderCourses();
    showToast('Refreshed', 'Latest data loaded from server', 'info');
  } catch (err) {
    console.error('Refresh failed:', err);
  }
}

// ==========================================================================
// Dashboard Renderers
// ==========================================================================
function renderDashboard() {
  const totalStudentsEl = document.getElementById('stat-total-students');
  const totalCoursesEl = document.getElementById('stat-total-courses');
  const multiCourseEl = document.getElementById('stat-multi-course');
  const sessionStatusEl = document.getElementById('stat-session-status');

  const students = state.students || [];
  const courses = state.courses || [];

  if (totalStudentsEl) totalStudentsEl.textContent = students.length;
  if (totalCoursesEl) totalCoursesEl.textContent = courses.length;

  const multiCount = students.filter(s => (s.course && s.course.length > 1) || (s.courses && s.courses.length > 1)).length;
  if (multiCourseEl) multiCourseEl.textContent = multiCount;

  if (sessionStatusEl) {
    sessionStatusEl.textContent = state.token ? 'Active JWT' : 'Guest';
    sessionStatusEl.style.color = state.token ? '#10b981' : '#94a3b8';
  }

  // Render quick course filter pills
  renderFilterPills();

  // Render recent students table in dashboard
  renderDashboardRecentStudents();
}

function renderFilterPills() {
  const container = document.getElementById('dashboard-filter-pills');
  if (!container) return;

  const courses = state.courses || [];
  let html = `<button class="filter-chip ${state.currentCourseFilter === 'ALL' ? 'active' : ''}" onclick="applyCourseFilter('ALL')">All Programs</button>`;

  courses.forEach(c => {
    const isActive = state.currentCourseFilter.toLowerCase() === c.courseName.toLowerCase();
    html += `<button class="filter-chip ${isActive ? 'active' : ''}" onclick="applyCourseFilter('${escapeHtml(c.courseName)}')">${escapeHtml(c.courseName)}</button>`;
  });

  container.innerHTML = html;
}

window.applyCourseFilter = async function(courseName) {
  state.currentCourseFilter = courseName;
  renderFilterPills();

  if (courseName === 'ALL') {
    if (state.token) {
      try {
        const list = await apiRequest('/Student/getAll');
        state.students = list;
      } catch (e) {}
    }
  } else {
    // Call backend endpoint /Student/FindByCourse?courseName=...
    try {
      const filtered = await apiRequest(`/Student/FindByCourse?courseName=${encodeURIComponent(courseName)}`);
      state.students = Array.isArray(filtered) ? filtered : [];
      showToast('Filter Applied', `Found ${state.students.length} students enrolled in ${courseName}`, 'info');
    } catch (err) {
      console.warn('Backend findByCourse query failed, using local filter:', err);
      state.students = (demoData.students || []).filter(s => {
        const list = s.course || s.courses || [];
        return list.some(c => (c.courseName || '').toLowerCase() === courseName.toLowerCase());
      });
    }
  }

  renderDashboardRecentStudents();
  renderStudents();
};

function renderDashboardRecentStudents() {
  const tbody = document.getElementById('dashboard-recent-table-body');
  if (!tbody) return;

  const students = state.students || [];
  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
      <div class="empty-state-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      </div>
      <h4>No students found</h4>
      <p>Register new students or sign in to synchronize with the MySQL database.</p>
      <button class="btn btn-primary btn-sm" onclick="openAddStudentModal()">+ Register Student</button>
    </td></tr>`;
    return;
  }

  const avatarColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)'
  ];

  tbody.innerHTML = students.slice(0, 5).map((s, idx) => {
    const courses = s.course || s.courses || [];
    const courseBadges = courses.length > 0
      ? courses.map(c => `<span class="course-tag">${escapeHtml(c.courseName || 'Course #' + c.id)}</span>`).join('')
      : `<span class="course-tag" style="opacity:0.6;">No Course</span>`;

    const bgGradient = avatarColors[s.id % avatarColors.length];
    const initial = (s.name || 'S')[0].toUpperCase();

    return `
      <tr>
        <td>
          <div class="student-avatar-cell">
            <div class="student-avatar" style="background: ${bgGradient};">${initial}</div>
            <div class="student-info-meta">
              <div class="student-name">${escapeHtml(s.name || 'Unnamed')}</div>
              <div class="student-id">ID: #${s.id}</div>
            </div>
          </div>
        </td>
        <td><span style="color:var(--text-muted);">${escapeHtml(s.email)}</span></td>
        <td><div class="course-tag-list">${courseBadges}</div></td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.78rem;color:#10b981;">
            <span style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span> Active
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn" title="View Profile" onclick="viewStudentDetails(${s.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="row-action-btn" title="Edit Student" onclick="openEditStudentModal(${s.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="row-action-btn delete" title="Delete" onclick="promptDelete('student', ${s.id}, '${escapeHtml(s.name || 'Student')}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// Students Directory Renderers
// ==========================================================================
function renderStudents() {
  const tbody = document.getElementById('students-table-body');
  const gridContainer = document.getElementById('students-cards-grid');
  const countBadge = document.getElementById('students-count-badge');
  if (!tbody) return;

  let list = [...(state.students || [])];

  // Search Query Filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const emailMatch = (s.email || '').toLowerCase().includes(q);
      const courses = s.course || s.courses || [];
      const courseMatch = courses.some(c => (c.courseName || '').toLowerCase().includes(q));
      return nameMatch || emailMatch || courseMatch;
    });
  }

  // Sort Filter
  if (state.studentSortBy === 'name_asc') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (state.studentSortBy === 'name_desc') {
    list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (state.studentSortBy === 'courses_desc') {
    list.sort((a, b) => ((b.course || b.courses || []).length) - ((a.course || a.courses || []).length));
  } else {
    // Default id_asc
    list.sort((a, b) => a.id - b.id);
  }

  if (countBadge) countBadge.textContent = `${list.length} Students`;

  if (list.length === 0) {
    const emptyHtml = `
      <tr><td colspan="6" class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <h4>No matching student records found</h4>
        <p>Try tweaking your search term, select another course filter, or register a new student.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddStudentModal()">+ Register New Student</button>
      </td></tr>
    `;
    tbody.innerHTML = emptyHtml;
    if (gridContainer) gridContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h4>No students found</h4></div>`;
    return;
  }

  const avatarColors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)'
  ];

  tbody.innerHTML = list.map(s => {
    const courses = s.course || s.courses || [];
    const courseBadges = courses.length > 0
      ? courses.map(c => `<span class="course-tag">${escapeHtml(c.courseName || 'Course #' + c.id)}</span>`).join('')
      : `<span class="course-tag" style="opacity:0.6;">No Course Assigned</span>`;

    const bgGradient = avatarColors[s.id % avatarColors.length];
    const initial = (s.name || 'S')[0].toUpperCase();

    return `
      <tr>
        <td style="font-family:monospace;font-weight:600;color:var(--text-subtle);">#${s.id}</td>
        <td>
          <div class="student-avatar-cell">
            <div class="student-avatar" style="background: ${bgGradient};">${initial}</div>
            <div class="student-info-meta">
              <div class="student-name">${escapeHtml(s.name || 'Unnamed')}</div>
              <div class="student-id">${escapeHtml(s.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-family:monospace;font-size:0.85rem;color:var(--text-muted);">${escapeHtml(s.email)}</span>
          <button class="row-action-btn" style="display:inline-flex;width:24px;height:24px;vertical-align:middle;margin-left:4px;" title="Copy Email" onclick="copyToClipboard('${escapeHtml(s.email)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </td>
        <td><div class="course-tag-list">${courseBadges}</div></td>
        <td>
          <span style="font-size:0.8rem;padding:0.2rem 0.55rem;border-radius:999px;background:rgba(16,185,129,0.12);color:#34d399;border:1px solid rgba(16,185,129,0.25);">
            Enrolled (${courses.length})
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn" title="View Student" onclick="viewStudentDetails(${s.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="row-action-btn" title="Edit Student" onclick="openEditStudentModal(${s.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="row-action-btn delete" title="Delete Student" onclick="promptDelete('student', ${s.id}, '${escapeHtml(s.name || 'Student')}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render Grid Cards as well
  if (gridContainer) {
    gridContainer.innerHTML = list.map(s => {
      const courses = s.course || s.courses || [];
      const courseBadges = courses.length > 0
        ? courses.map(c => `<span class="course-tag">${escapeHtml(c.courseName || 'Course #' + c.id)}</span>`).join('')
        : `<span class="course-tag" style="opacity:0.6;">No Course</span>`;
      const bgGradient = avatarColors[s.id % avatarColors.length];
      const initial = (s.name || 'S')[0].toUpperCase();

      return `
        <div class="course-card" style="padding:1.25rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
            <div class="student-avatar" style="background:${bgGradient};">${initial}</div>
            <div>
              <div style="font-weight:700;font-size:1.05rem;">${escapeHtml(s.name || 'Unnamed')}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(s.email)}</div>
            </div>
          </div>
          <div style="margin-bottom:1rem;">
            <span style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--text-subtle);display:block;margin-bottom:0.35rem;">Enrolled Courses</span>
            <div class="course-tag-list">${courseBadges}</div>
          </div>
          <div class="course-card-footer" style="padding-top:0.75rem;">
            <span style="font-size:0.75rem;color:var(--text-subtle);">Student ID: #${s.id}</span>
            <div class="row-actions">
              <button class="row-action-btn" title="Edit" onclick="openEditStudentModal(${s.id})"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
              <button class="row-action-btn delete" title="Delete" onclick="promptDelete('student', ${s.id}, '${escapeHtml(s.name || 'Student')}')"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.toggleStudentView = function(mode) {
  state.studentViewMode = mode;
  const tableWrap = document.getElementById('students-table-wrap');
  const gridWrap = document.getElementById('students-cards-grid');
  const btnTable = document.getElementById('view-mode-table-btn');
  const btnGrid = document.getElementById('view-mode-grid-btn');

  if (mode === 'grid') {
    if (tableWrap) tableWrap.style.display = 'none';
    if (gridWrap) gridWrap.style.display = 'grid';
    btnTable?.classList.remove('active');
    btnGrid?.classList.add('active');
  } else {
    if (tableWrap) tableWrap.style.display = 'block';
    if (gridWrap) gridWrap.style.display = 'none';
    btnTable?.classList.add('active');
    btnGrid?.classList.remove('active');
  }
};

// ==========================================================================
// Courses Renderers
// ==========================================================================
function renderCourses() {
  const container = document.getElementById('courses-cards-container');
  const countBadge = document.getElementById('courses-count-badge');
  if (!container) return;

  const courses = state.courses || [];
  if (countBadge) countBadge.textContent = `${courses.length} Programs`;

  if (courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <h4>No Courses registered yet</h4>
        <p>Get started by creating your first academic course.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddCourseModal()">+ Create Course</button>
      </div>
    `;
    return;
  }

  container.innerHTML = courses.map(c => {
    // Count enrolled students in this course
    const enrolledStudents = (state.students || []).filter(s => {
      const list = s.course || s.courses || [];
      return list.some(item => item.id === c.id || (item.courseName || '').toLowerCase() === c.courseName.toLowerCase());
    });

    return `
      <div class="course-card">
        <div class="course-card-top">
          <span class="course-badge-id">COURSE #${c.id}</span>
          <button class="row-action-btn delete" title="Delete Course" onclick="promptDelete('course', ${c.id}, '${escapeHtml(c.courseName)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
        <h4 class="course-card-title">${escapeHtml(c.courseName)}</h4>
        <div class="course-duration-pill">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${escapeHtml(c.duration || 'Flexible')}
        </div>
        <div class="course-card-footer">
          <span class="course-enrolled-count">
            Enrolled: <strong>${enrolledStudents.length} Students</strong>
          </span>
          <button class="btn btn-secondary btn-sm" onclick="inspectCourseEnrollment('${escapeHtml(c.courseName)}')">
            View Roster
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.inspectCourseEnrollment = function(courseName) {
  switchTab('enrollment');
  const select = document.getElementById('enrollment-course-select');
  if (select) {
    select.value = courseName;
    executeEnrollmentQuery(courseName);
  }
};

// ==========================================================================
// Course Enrollment Explorer
// ==========================================================================
function setupEnrollmentExplorer() {
  const select = document.getElementById('enrollment-course-select');
  if (!select) return;

  const courses = state.courses || [];
  select.innerHTML = `<option value="">-- Choose a Course to Inspect --</option>` +
    courses.map(c => `<option value="${escapeHtml(c.courseName)}">${escapeHtml(c.courseName)} (${escapeHtml(c.duration || 'Duration N/A')})</option>`).join('');

  if (courses.length > 0 && !select.value) {
    select.value = courses[0].courseName;
    executeEnrollmentQuery(courses[0].courseName);
  }
}

async function executeEnrollmentQuery(courseName) {
  const container = document.getElementById('enrollment-results-container');
  const title = document.getElementById('enrollment-results-title');
  if (!container || !courseName) return;

  container.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-muted);">Querying Spring Boot: <code>/Student/FindByCourse?courseName=${encodeURIComponent(courseName)}</code>...</div>`;
  if (title) title.textContent = `Students Enrolled in "${courseName}"`;

  try {
    const students = await apiRequest(`/Student/FindByCourse?courseName=${encodeURIComponent(courseName)}`);
    const list = Array.isArray(students) ? students : [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <h4>No students currently enrolled in ${escapeHtml(courseName)}</h4>
          <p>Assign students to this course from the Students directory.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="app-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>All Enrolled Courses</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(s => {
            const allCourses = s.course || s.courses || [];
            return `
              <tr>
                <td>
                  <div class="student-avatar-cell">
                    <div class="student-avatar" style="background:var(--grad-primary);">${(s.name || 'S')[0].toUpperCase()}</div>
                    <div class="student-info-meta">
                      <div class="student-name">${escapeHtml(s.name || 'Student')}</div>
                      <div class="student-id">ID: #${s.id}</div>
                    </div>
                  </div>
                </td>
                <td><span style="color:var(--text-muted);">${escapeHtml(s.email)}</span></td>
                <td>
                  <div class="course-tag-list">
                    ${allCourses.map(c => `<span class="course-tag ${c.courseName === courseName ? 'emerald' : ''}">${escapeHtml(c.courseName)}</span>`).join('')}
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="viewStudentDetails(${s.id})">Profile</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p style="color:var(--accent-rose);">Error querying course: ${err.message}</p></div>`;
  }
}

// ==========================================================================
// Security & API Hub
// ==========================================================================
function renderSecurityHub() {
  const tokenDisplay = document.getElementById('jwt-token-display');
  const tokenPayload = document.getElementById('jwt-payload-display');
  const copyBtn = document.getElementById('copy-jwt-btn');

  if (state.token) {
    if (tokenDisplay) tokenDisplay.textContent = state.token;
    if (copyBtn) copyBtn.disabled = false;

    // Decode JWT payload for visualization
    try {
      const parts = state.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (tokenPayload) tokenPayload.textContent = JSON.stringify(payload, null, 2);
      }
    } catch (e) {
      if (tokenPayload) tokenPayload.textContent = 'Unable to parse token claims.';
    }
  } else {
    if (tokenDisplay) tokenDisplay.textContent = 'No active JWT token. Please sign in to generate a session bearer token.';
    if (tokenPayload) tokenPayload.textContent = 'None';
    if (copyBtn) copyBtn.disabled = true;
  }
}

// ==========================================================================
// Modals & Action Workflows
// ==========================================================================
window.openAuthModal = function(tab = 'signin') {
  openModal('modal-auth');
  switchAuthTab(tab);
};

window.switchAuthTab = function(tab) {
  const tabSignin = document.getElementById('tab-btn-signin');
  const tabRegister = document.getElementById('tab-btn-register');
  const formSignin = document.getElementById('auth-form-signin');
  const formRegister = document.getElementById('auth-form-register');

  if (tab === 'signin') {
    tabSignin?.classList.add('active');
    tabRegister?.classList.remove('active');
    if (formSignin) formSignin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
  } else {
    tabSignin?.classList.remove('active');
    tabRegister?.classList.add('active');
    if (formSignin) formSignin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'block';
  }
};

window.openAddStudentModal = function() {
  document.getElementById('student-modal-title').textContent = 'Register New Student';
  document.getElementById('student-form-id').value = '';
  document.getElementById('student-form-name').value = '';
  document.getElementById('student-form-email').value = '';

  // Render course checkboxes
  renderCourseCheckboxes([]);
  openModal('modal-student');
};

window.openEditStudentModal = async function(id) {
  let student = (state.students || []).find(s => s.id === id);

  if (!student && state.backendOnline) {
    try {
      student = await apiRequest(`/Student/getbyid/${id}`);
    } catch (e) {}
  }

  if (!student) {
    showToast('Error', 'Student record not found', 'error');
    return;
  }

  document.getElementById('student-modal-title').textContent = `Edit Student #${id}`;
  document.getElementById('student-form-id').value = student.id;
  document.getElementById('student-form-name').value = student.name || '';
  document.getElementById('student-form-email').value = student.email || '';

  const assignedCourses = student.course || student.courses || [];
  const assignedIds = assignedCourses.map(c => c.id);
  renderCourseCheckboxes(assignedIds);

  openModal('modal-student');
};

function renderCourseCheckboxes(selectedIds = []) {
  const container = document.getElementById('student-courses-checkboxes');
  if (!container) return;

  const courses = state.courses || [];
  if (courses.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem;color:var(--text-muted);padding:0.5rem;">No courses created yet. Create a course first.</p>`;
    return;
  }

  container.innerHTML = courses.map(c => {
    const isChecked = selectedIds.includes(c.id);
    return `
      <label class="checkbox-label">
        <input type="checkbox" name="student_course" value="${c.id}" ${isChecked ? 'checked' : ''}>
        <span>${escapeHtml(c.courseName)} <small style="color:var(--text-subtle);">(${escapeHtml(c.duration || '')})</small></span>
      </label>
    `;
  }).join('');
}

window.saveStudentForm = async function(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('student-form-id').value;
  const name = document.getElementById('student-form-name').value.trim();
  const email = document.getElementById('student-form-email').value.trim();

  if (!name || !email) {
    showToast('Validation Error', 'Name and Email are required', 'warning');
    return;
  }

  // Get selected courses
  const checkboxes = document.querySelectorAll('input[name="student_course"]:checked');
  const selectedCourseIds = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
  const coursesPayload = selectedCourseIds.map(cid => ({ id: cid }));

  const payload = {
    name,
    email,
    course: coursesPayload
  };

  try {
    if (id) {
      // Update: PUT /Student/update/{id}
      await apiRequest(`/Student/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast('Student Updated', `${name}'s record has been updated`, 'success');
    } else {
      // Create: POST /Student/save
      await apiRequest('/Student/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Student Registered', `${name} successfully added to database`, 'success');
    }

    closeModal('modal-student');
    await refreshAllData();
  } catch (err) {
    // If backend is offline or returned error, save locally in state for testing
    if (!state.backendOnline) {
      if (id) {
        const idx = state.students.findIndex(s => s.id === parseInt(id, 10));
        if (idx !== -1) {
          state.students[idx] = { ...state.students[idx], name, email, course: coursesPayload };
        }
      } else {
        const newId = (state.students.length ? Math.max(...state.students.map(s => s.id)) : 0) + 1;
        state.students.push({ id: newId, name, email, course: coursesPayload });
      }
      closeModal('modal-student');
      renderDashboard();
      renderStudents();
      showToast('Saved (Demo Mode)', 'Student record saved in local memory', 'info');
      return;
    }
    showToast('Save Failed', err.message || 'Could not save student', 'error');
  }
};

window.openAddCourseModal = function() {
  document.getElementById('course-form-name').value = '';
  document.getElementById('course-form-duration').value = '';
  openModal('modal-course');
};

window.saveCourseForm = async function(e) {
  if (e) e.preventDefault();
  const courseName = document.getElementById('course-form-name').value.trim();
  const duration = document.getElementById('course-form-duration').value.trim();

  if (!courseName) {
    showToast('Validation Error', 'Course Name is required', 'warning');
    return;
  }

  const payload = {
    courseName,
    duration: duration || 'Flexible'
  };

  try {
    await apiRequest('/Course/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    closeModal('modal-course');
    showToast('Course Created', `${courseName} added successfully`, 'success');
    await refreshAllData();
  } catch (err) {
    if (!state.backendOnline) {
      const newId = (state.courses.length ? Math.max(...state.courses.map(c => c.id)) : 0) + 1;
      state.courses.push({ id: newId, courseName, duration });
      closeModal('modal-course');
      renderCourses();
      renderDashboard();
      showToast('Course Created (Demo Mode)', `${courseName} added to local demo state`, 'info');
      return;
    }
    showToast('Error', err.message || 'Could not save course', 'error');
  }
};

window.viewStudentDetails = async function(id) {
  let student = (state.students || []).find(s => s.id === id);
  if (!student && state.backendOnline) {
    try {
      student = await apiRequest(`/Student/getbyid/${id}`);
    } catch (e) {}
  }
  if (!student) return;

  const content = document.getElementById('student-view-content');
  if (!content) return;

  const courses = student.course || student.courses || [];
  const coursesHtml = courses.length > 0
    ? courses.map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--bg-input);border-radius:var(--radius-sm);margin-bottom:0.5rem;">
        <div>
          <div style="font-weight:600;">${escapeHtml(c.courseName)}</div>
          <div style="font-size:0.75rem;color:var(--text-subtle);">Duration: ${escapeHtml(c.duration || 'Standard')}</div>
        </div>
        <span class="course-tag cyan">Active</span>
      </div>
    `).join('')
    : `<p style="color:var(--text-muted);font-size:0.85rem;">No courses assigned to this student.</p>`;

  content.innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem;">
      <div class="student-avatar" style="width:64px;height:64px;font-size:1.5rem;margin:0 auto 0.75rem;background:var(--grad-primary);">
        ${(student.name || 'S')[0].toUpperCase()}
      </div>
      <h3 style="font-size:1.4rem;margin-bottom:0.25rem;">${escapeHtml(student.name || 'Unnamed')}</h3>
      <p style="color:var(--text-muted);font-size:0.9rem;">${escapeHtml(student.email)}</p>
      <span style="display:inline-block;margin-top:0.4rem;font-size:0.75rem;padding:0.2rem 0.6rem;background:rgba(255,255,255,0.06);border-radius:999px;font-family:monospace;">
        STUDENT ID #${student.id}
      </span>
    </div>

    <div style="border-top:1px solid var(--border-subtle);padding-top:1.25rem;">
      <h5 style="font-size:0.85rem;text-transform:uppercase;color:var(--text-subtle);margin-bottom:0.75rem;letter-spacing:0.05em;">
        Enrolled Curriculum (${courses.length})
      </h5>
      ${coursesHtml}
    </div>
  `;

  openModal('modal-view-student');
};

window.promptDelete = function(type, id, name) {
  state.deleteTarget = { type, id, name };
  const title = document.getElementById('delete-modal-title');
  const msg = document.getElementById('delete-modal-msg');
  if (title) title.textContent = `Delete ${type === 'student' ? 'Student' : 'Course'}`;
  if (msg) msg.textContent = `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`;
  openModal('modal-delete');
};

window.executeDelete = async function() {
  if (!state.deleteTarget) return;
  const { type, id, name } = state.deleteTarget;
  closeModal('modal-delete');

  try {
    if (type === 'student') {
      await apiRequest(`/Student/delete/${id}`, { method: 'DELETE' });
      showToast('Student Removed', `${name} has been deleted`, 'info');
    } else {
      await apiRequest(`/Course/delete/${id}`, { method: 'DELETE' });
      showToast('Course Removed', `${name} has been deleted`, 'info');
    }
    await refreshAllData();
  } catch (err) {
    if (!state.backendOnline) {
      if (type === 'student') {
        state.students = state.students.filter(s => s.id !== id);
        renderStudents();
        renderDashboard();
      } else {
        state.courses = state.courses.filter(c => c.id !== id);
        renderCourses();
        renderDashboard();
      }
      showToast('Deleted (Demo Mode)', `${name} removed from local session`, 'info');
      return;
    }
    showToast('Delete Failed', err.message || 'Could not delete item', 'error');
  }
};

// ==========================================================================
// Event Listeners & Global Helpers
// ==========================================================================
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Sync Refresh
  document.getElementById('sync-refresh-btn')?.addEventListener('click', () => {
    refreshAllData();
  });

  // Global Search input
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.activeTab !== 'students') {
        switchTab('students');
      }
      renderStudents();
    });
  }

  // Keyboard shortcut: '/' to search, 'Escape' to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !isModalOpen()) {
      e.preventDefault();
      searchInput?.focus();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // User Auth Profile button
  document.getElementById('user-auth-btn')?.addEventListener('click', () => {
    if (state.token) {
      handleLogout(true);
    } else {
      openAuthModal('signin');
    }
  });

  // Student Sort Select
  document.getElementById('students-sort-select')?.addEventListener('change', (e) => {
    state.studentSortBy = e.target.value;
    renderStudents();
  });

  // Export Data to CSV
  document.getElementById('export-students-btn')?.addEventListener('click', exportStudentsCSV);

  // Course Enrollment Inspector Dropdown
  document.getElementById('enrollment-course-select')?.addEventListener('change', (e) => {
    executeEnrollmentQuery(e.target.value);
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function isModalOpen() {
  return !!document.querySelector('.modal-overlay.active');
}

window.quickFillDemoAccount = function() {
  const emailInput = document.getElementById('signin-email');
  const passInput = document.getElementById('signin-password');
  if (emailInput) emailInput.value = 'demo@example.com';
  if (passInput) passInput.value = 'password123'; // demo placeholder
  showToast('Demo Credentials Filled', 'Click "Sign In" or enter your account password', 'info');
};

// Toast Notifications
window.showToast = function(title, msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(msg)}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Data Export
function exportStudentsCSV() {
  const students = state.students || [];
  if (students.length === 0) {
    showToast('Export', 'No student records to export', 'warning');
    return;
  }

  let csvContent = 'ID,Name,Email,Courses\n';
  students.forEach(s => {
    const courses = (s.course || s.courses || []).map(c => c.courseName).join('; ');
    csvContent += `"${s.id}","${(s.name || '').replace(/"/g, '""')}","${(s.email || '').replace(/"/g, '""')}","${courses}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `students_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Export Success', 'Students data downloaded as CSV', 'success');
}

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied', 'Copied to clipboard', 'info');
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
