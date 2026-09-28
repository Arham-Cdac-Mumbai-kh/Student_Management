import React, { useState, useEffect, useMemo } from 'react';
import * as api from './api';

const demoBaseline = {
  courses: [
    { id: 1, courseName: 'Java', duration: '6 Months' },
    { id: 2, courseName: 'DSA', duration: '3 Months' },
    { id: 3, courseName: 'React', duration: '4 Months' },
    { id: 4, courseName: 'Spring Boot', duration: '5 Months' }
  ],
  students: [
    { id: 1, name: 'IRAm', email: 'syeedarham.in@gmail.com', course: [{ id: 2, courseName: 'DSA' }] },
    { id: 2, name: 'Arham', email: 'arham@gmail.com', course: [{ id: 1, courseName: 'Java' }, { id: 2, courseName: 'DSA' }] },
    { id: 3, name: 'Rahul', email: 'rahul@gmail.com', course: [{ id: 1, courseName: 'Java' }, { id: 3, courseName: 'React' }] },
    { id: 4, name: 'Amit', email: 'amit@gmail.com', course: [{ id: 2, courseName: 'DSA' }, { id: 4, courseName: 'Spring Boot' }] }
  ]
};

const avatarColors = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)'
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('aura_theme') || 'dark');
  const [user, setUserState] = useState(api.getUser());
  const [token, setTokenState] = useState(api.getToken());
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [backendOnline, setBackendOnline] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Filters & Controls
  const [activeCourseFilter, setActiveCourseFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('id_asc');
  const [viewMode, setViewMode] = useState('table');

  // Enrollment Query Tab state
  const [enrollCourse, setEnrollCourse] = useState('');
  const [enrollResults, setEnrollResults] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Modals
  const [authModal, setAuthModal] = useState({ open: false, mode: 'signin' });
  const [studentModal, setStudentModal] = useState({ open: false, student: null });
  const [profileModal, setProfileModal] = useState({ open: false, student: null });
  const [courseModal, setCourseModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, target: null });

  // Form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDuration, setCourseDuration] = useState('');

  // Toast Helper
  const showToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura_theme', theme);
  }, [theme]);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const cList = await api.getCourses();
      setCourses(Array.isArray(cList) ? cList : []);

      if (api.getToken()) {
        try {
          const sList = await api.getStudents();
          setStudents(Array.isArray(sList) ? sList : []);
        } catch (e) {
          console.warn('Need auth to fetch students:', e.message);
        }
      }
      setBackendOnline(true);
    } catch (err) {
      console.warn('Connecting with demo fallback:', err.message);
      setBackendOnline(false);
      setCourses(demoBaseline.courses);
      setStudents(demoBaseline.students);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Course Filter on Dashboard
  const handleApplyCourseFilter = async (cName) => {
    setActiveCourseFilter(cName);
    if (cName === 'ALL') {
      if (token) {
        try {
          const res = await api.getStudents();
          setStudents(res);
        } catch (e) {}
      }
    } else {
      try {
        const res = await api.getStudentsByCourse(cName);
        setStudents(Array.isArray(res) ? res : []);
        showToast('Filter Applied', `Found ${res.length} students enrolled in ${cName}`, 'info');
      } catch (e) {
        // Fallback filter
        const filtered = (demoBaseline.students || []).filter(s => {
          const list = s.course || s.courses || [];
          return list.some(c => (c.courseName || '').toLowerCase() === cName.toLowerCase());
        });
        setStudents(filtered);
      }
    }
  };

  // Run Enrollment Query
  const handleRunEnrollQuery = async (cName) => {
    if (!cName) return;
    setEnrollCourse(cName);
    setEnrollLoading(true);
    try {
      const res = await api.getStudentsByCourse(cName);
      setEnrollResults(Array.isArray(res) ? res : []);
    } catch (err) {
      showToast('Query Error', err.message, 'error');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Filter & Sort Students
  const displayedStudents = useMemo(() => {
    let list = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const emailMatch = (s.email || '').toLowerCase().includes(q);
        const coursesList = s.course || s.courses || [];
        const courseMatch = coursesList.some(c => (c.courseName || '').toLowerCase().includes(q));
        return nameMatch || emailMatch || courseMatch;
      });
    }

    if (sortMode === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortMode === 'courses_desc') {
      list.sort((a, b) => ((b.course || b.courses || []).length) - ((a.course || a.courses || []).length));
    } else {
      list.sort((a, b) => a.id - b.id);
    }

    return list;
  }, [students, searchQuery, sortMode]);

  // Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authModal.mode === 'signin') {
      try {
        const { user: loggedInUser, token: jwt } = await api.login(authEmail, authPass);
        setUserState(loggedInUser);
        setTokenState(jwt);
        setAuthModal({ open: false, mode: 'signin' });
        showToast('Welcome!', `Logged in successfully as ${authEmail}`, 'success');
        fetchData();
      } catch (err) {
        showToast('Login Failed', err.message || 'Invalid credentials', 'error');
      }
    } else {
      try {
        await api.register(authName, authEmail, authPass);
        showToast('Registered', 'Account created! Signing you in...', 'success');
        const { user: loggedInUser, token: jwt } = await api.login(authEmail, authPass);
        setUserState(loggedInUser);
        setTokenState(jwt);
        setAuthModal({ open: false, mode: 'signin' });
        fetchData();
      } catch (err) {
        showToast('Registration Error', err.message, 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setUserState(null);
    setTokenState('');
    setStudents([]);
    setTab('dashboard');
    setAuthModal({ open: true, mode: 'signin' });
    showToast('Signed Out', 'You have been logged out. Please sign in.', 'info');
    fetchData();
  };

  // Student Save Submit
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentName || !studentEmail) return;

    const payload = {
      name: studentName,
      email: studentEmail,
      course: selectedCourses.map(id => ({ id }))
    };

    try {
      if (studentModal.student?.id) {
        await api.updateStudent(studentModal.student.id, payload);
        showToast('Updated', `${studentName} updated successfully`, 'success');
      } else {
        await api.addStudent(payload);
        showToast('Registered', `${studentName} added to database`, 'success');
      }
      setStudentModal({ open: false, student: null });
      fetchData();
    } catch (err) {
      if (!backendOnline) {
        if (studentModal.student?.id) {
          setStudents(prev => prev.map(s => s.id === studentModal.student.id ? { ...s, ...payload } : s));
        } else {
          const newId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 1;
          setStudents(prev => [...prev, { id: newId, ...payload }]);
        }
        setStudentModal({ open: false, student: null });
        showToast('Saved (Demo)', 'Updated in local demo state', 'info');
        return;
      }
      showToast('Save Failed', err.message, 'error');
    }
  };

  // Course Save Submit
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle) return;

    const payload = {
      courseName: courseTitle,
      duration: courseDuration || 'Flexible'
    };

    try {
      await api.addCourse(payload);
      showToast('Course Created', `${courseTitle} added successfully`, 'success');
      setCourseModal(false);
      setCourseTitle('');
      setCourseDuration('');
      fetchData();
    } catch (err) {
      if (!backendOnline) {
        const newId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
        setCourses(prev => [...prev, { id: newId, ...payload }]);
        setCourseModal(false);
        showToast('Created (Demo)', `${courseTitle} added to demo state`, 'info');
        return;
      }
      showToast('Error', err.message, 'error');
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteModal.target) return;
    const { type, id, name } = deleteModal.target;
    setDeleteModal({ open: false, target: null });

    try {
      if (type === 'student') {
        await api.deleteStudent(id);
        showToast('Deleted', `Student ${name} deleted`, 'info');
      } else {
        await api.deleteCourse(id);
        showToast('Deleted', `Course ${name} deleted`, 'info');
      }
      fetchData();
    } catch (err) {
      if (!backendOnline) {
        if (type === 'student') setStudents(prev => prev.filter(s => s.id !== id));
        if (type === 'course') setCourses(prev => prev.filter(c => c.id !== id));
        showToast('Deleted (Demo)', `${name} removed`, 'info');
        return;
      }
      showToast('Delete Failed', err.message, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast('Export', 'No student records to export', 'warning');
      return;
    }
    let csv = 'ID,Name,Email,Courses\n';
    students.forEach(s => {
      const cStr = (s.course || s.courses || []).map(c => c.courseName).join('; ');
      csv += `"${s.id}","${(s.name || '').replace(/"/g, '""')}","${(s.email || '').replace(/"/g, '""')}","${cStr}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_react_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Export Success', 'Students exported as CSV', 'success');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <img src="/assets/logo.jpg" alt="AuraEdu" className="app-brand-logo" />
          <div className="brand-text">
            <h1>AuraEdu</h1>
            <span>React Multi-Port Edition</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Core</div>

          <div className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Dashboard</span>
          </div>

          <div className={`nav-item ${tab === 'students' ? 'active' : ''}`} onClick={() => setTab('students')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Students</span>
            <span className="nav-badge">{students.length}</span>
          </div>

          <div className={`nav-item ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span>Courses</span>
            <span className="nav-badge">{courses.length}</span>
          </div>

          <div className="nav-section-label">Operations</div>

          <div className={`nav-item ${tab === 'enrollment' ? 'active' : ''}`} onClick={() => { setTab('enrollment'); if (courses[0]) handleRunEnrollQuery(courses[0].courseName); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Enrollment Query</span>
          </div>

          <div className={`nav-item ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>API & Security</span>
          </div>
        </nav>

        {/* Backend Connection Badge */}
        <div style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? '#10b981' : '#f59e0b', boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }}></span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            {backendOnline ? 'Spring Boot 8080 (Proxied)' : 'Demo Fallback'}
          </span>
        </div>

        {/* User Profile Pill */}
        <div className="sidebar-footer">
          <div className="user-profile-pill">
            <div className="user-avatar">
              {user ? (user.name || user.email)[0].toUpperCase() : '?'}
            </div>
            <div className="user-meta">
              <div className="user-name">{user ? (user.name || user.email.split('@')[0]) : 'Guest User'}</div>
              <div className="user-status">
                <span className="status-dot" style={{ background: user ? '#10b981' : '#94a3b8' }}></span>
                {user ? 'Authenticated' : 'Not Signed In'}
              </div>
            </div>
            {user ? (
              <button className="auth-action-btn" title="Sign Out" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            ) : (
              <button className="auth-action-btn" title="Sign In" onClick={() => setAuthModal({ open: true, mode: 'signin' })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <div className="header-title-wrap">
              <h2>
                {tab === 'dashboard' && 'Dashboard Overview'}
                {tab === 'students' && 'Students Directory'}
                {tab === 'courses' && 'Courses & Curriculum'}
                {tab === 'enrollment' && 'Course Enrollment Explorer'}
                {tab === 'security' && 'API & Security Hub'}
              </h2>
              <p>Cross-port React client communicating with Spring Boot REST API</p>
            </div>
          </div>

          <div className="header-search">
            <input
              type="text"
              placeholder="Search students, emails, courses..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (tab !== 'students') setTab('students'); }}
            />
            <span className="search-shortcut">/</span>
          </div>

          <div className="header-actions">
            <button className="icon-btn" title="Sync Live Data" onClick={fetchData}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            </button>

            <button className="icon-btn" title="Toggle Theme" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={() => setCourseModal(true)}>
              + Course
            </button>

            <button className="btn btn-primary btn-sm" onClick={() => {
              setStudentName('');
              setStudentEmail('');
              setSelectedCourses([]);
              setStudentModal({ open: true, student: null });
            }}>
              Register Student
            </button>
          </div>
        </header>

        {/* Content Body Views */}
        <div className="content-body">
          {/* VIEW: DASHBOARD */}
          {tab === 'dashboard' && (
            <div>
              <div className="hero-banner">
                <div className="hero-content">
                  <div className="hero-badge">React SPA on Port 5173 ↔ Spring Boot 8080</div>
                  <h2>Intelligent Academic Portal</h2>
                  <p>Real-time cross-port management of student records, course catalog, JWT credentials, and native SQL joins.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={() => { setStudentName(''); setStudentEmail(''); setSelectedCourses([]); setStudentModal({ open: true, student: null }); }}>
                    + New Student
                  </button>
                  <button className="btn btn-secondary" onClick={() => setCourseModal(true)}>
                    + New Course
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Total Students</span>
                    <div className="metric-icon-box purple">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    </div>
                  </div>
                  <div className="metric-value">{students.length}</div>
                  <div className="metric-sub"><span style={{ color: '#10b981', fontWeight: 700 }}>Active</span> Enrolled In Database</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Active Courses</span>
                    <div className="metric-icon-box cyan">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    </div>
                  </div>
                  <div className="metric-value">{courses.length}</div>
                  <div className="metric-sub">Curriculum Catalog in MySQL</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Multi-Course Students</span>
                    <div className="metric-icon-box emerald">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                  </div>
                  <div className="metric-value">
                    {students.filter(s => (s.course || s.courses || []).length > 1).length}
                  </div>
                  <div className="metric-sub">Dual / Multi Specializations</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Security & Token</span>
                    <div className="metric-icon-box amber">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                  </div>
                  <div className="metric-value" style={{ fontSize: '1.6rem', color: token ? '#10b981' : '#94a3b8' }}>
                    {token ? 'Active JWT' : 'Guest'}
                  </div>
                  <div className="metric-sub">Spring Security & JWT Filter</div>
                </div>
              </div>

              {/* Course Filter Chips */}
              <div className="filter-pills-card">
                <span className="filter-pills-title">Filter By Program:</span>
                <div className="filter-pills-wrap">
                  <button className={`filter-chip ${activeCourseFilter === 'ALL' ? 'active' : ''}`} onClick={() => handleApplyCourseFilter('ALL')}>
                    All Programs
                  </button>
                  {courses.map(c => (
                    <button
                      key={c.id}
                      className={`filter-chip ${activeCourseFilter === c.courseName ? 'active' : ''}`}
                      onClick={() => handleApplyCourseFilter(c.courseName)}
                    >
                      {c.courseName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Students Table */}
              <div className="data-card">
                <div className="data-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3>Recent Registrations</h3>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setTab('students')}>
                    View All Students →
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email Address</th>
                        <th>Enrolled Programs</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 5).map(s => {
                        const sCourses = s.course || s.courses || [];
                        const bg = avatarColors[s.id % avatarColors.length];
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="student-avatar-cell">
                                <div className="student-avatar" style={{ background: bg }}>
                                  {(s.name || 'S')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{s.name || 'Unnamed'}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>ID: #{s.id}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{ color: 'var(--text-muted)' }}>{s.email}</span></td>
                            <td>
                              <div className="course-tag-list">
                                {sCourses.length > 0 ? (
                                  sCourses.map((c, i) => (
                                    <span key={i} className="course-tag">{c.courseName || `Course #${c.id}`}</span>
                                  ))
                                ) : (
                                  <span className="course-tag" style={{ opacity: 0.6 }}>No Course</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span> Active
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button className="row-action-btn" title="View Profile" onClick={() => setProfileModal({ open: true, student: s })}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                                <button className="row-action-btn" title="Edit Student" onClick={() => {
                                  setStudentName(s.name || '');
                                  setStudentEmail(s.email || '');
                                  setSelectedCourses((s.course || s.courses || []).map(c => c.id));
                                  setStudentModal({ open: true, student: s });
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button className="row-action-btn delete" title="Delete" onClick={() => setDeleteModal({ open: true, target: { type: 'student', id: s.id, name: s.name } })}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: STUDENTS */}
          {tab === 'students' && (
            <div className="data-card">
              <div className="data-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3>Students Directory</h3>
                  <span className="nav-badge">{displayedStudents.length} Students</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="form-control" style={{ width: 'auto', padding: '0.45rem 0.85rem' }} value={sortMode} onChange={e => setSortMode(e.target.value)}>
                    <option value="id_asc">Sort: ID (Asc)</option>
                    <option value="name_asc">Sort: Name (A-Z)</option>
                    <option value="name_desc">Sort: Name (Z-A)</option>
                    <option value="courses_desc">Sort: Most Courses</option>
                  </select>

                  <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <button className={`row-action-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                    <button className={`row-action-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </button>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>Export CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setStudentName(''); setStudentEmail(''); setSelectedCourses([]); setStudentModal({ open: true, student: null }); }}>
                    + Register Student
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="table-responsive">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Email Address</th>
                        <th>Enrolled Courses</th>
                        <th>Enrollment Count</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStudents.map(s => {
                        const sCourses = s.course || s.courses || [];
                        const bg = avatarColors[s.id % avatarColors.length];
                        return (
                          <tr key={s.id}>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-subtle)' }}>#{s.id}</td>
                            <td>
                              <div className="student-avatar-cell">
                                <div className="student-avatar" style={{ background: bg }}>
                                  {(s.name || 'S')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{s.name || 'Unnamed'}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{s.email}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{ color: 'var(--text-muted)' }}>{s.email}</span></td>
                            <td>
                              <div className="course-tag-list">
                                {sCourses.map((c, i) => (
                                  <span key={i} className="course-tag">{c.courseName || `Course #${c.id}`}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.55rem', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                                Enrolled ({sCourses.length})
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button className="row-action-btn" title="View Profile" onClick={() => setProfileModal({ open: true, student: s })}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                                <button className="row-action-btn" title="Edit Student" onClick={() => {
                                  setStudentName(s.name || '');
                                  setStudentEmail(s.email || '');
                                  setSelectedCourses((s.course || s.courses || []).map(c => c.id));
                                  setStudentModal({ open: true, student: s });
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button className="row-action-btn delete" title="Delete" onClick={() => setDeleteModal({ open: true, target: { type: 'student', id: s.id, name: s.name } })}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="courses-grid" style={{ padding: '1.5rem' }}>
                  {displayedStudents.map(s => {
                    const sCourses = s.course || s.courses || [];
                    const bg = avatarColors[s.id % avatarColors.length];
                    return (
                      <div key={s.id} className="course-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div className="student-avatar" style={{ background: bg }}>
                            {(s.name || 'S')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.name || 'Unnamed'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div className="course-tag-list">
                            {sCourses.map((c, i) => (
                              <span key={i} className="course-tag">{c.courseName || `Course #${c.id}`}</span>
                            ))}
                          </div>
                        </div>
                        <div className="course-card-footer">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Student ID: #{s.id}</span>
                          <div className="row-actions">
                            <button className="row-action-btn" onClick={() => { setStudentName(s.name || ''); setStudentEmail(s.email || ''); setSelectedCourses((s.course || s.courses || []).map(c => c.id)); setStudentModal({ open: true, student: s }); }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button className="row-action-btn delete" onClick={() => setDeleteModal({ open: true, target: { type: 'student', id: s.id, name: s.name } })}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: COURSES */}
          {tab === 'courses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem' }}>Curriculum & Programs</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track program offerings, student enrollment, and durations</p>
                </div>
                <button className="btn btn-primary" onClick={() => setCourseModal(true)}>
                  + Create Course
                </button>
              </div>

              <div className="courses-grid">
                {courses.map(c => {
                  const enrolled = students.filter(s => {
                    const list = s.course || s.courses || [];
                    return list.some(item => item.id === c.id || (item.courseName || '').toLowerCase() === c.courseName.toLowerCase());
                  });
                  return (
                    <div key={c.id} className="course-card">
                      <div className="course-card-top">
                        <span className="course-badge-id">COURSE #{c.id}</span>
                        <button className="row-action-btn delete" title="Delete" onClick={() => setDeleteModal({ open: true, target: { type: 'course', id: c.id, name: c.courseName } })}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                      <h4 className="course-card-title">{c.courseName}</h4>
                      <div className="course-duration-pill">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {c.duration || 'Flexible'}
                      </div>
                      <div className="course-card-footer">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Enrolled: <strong style={{ color: 'var(--text-main)' }}>{enrolled.length} Students</strong>
                        </span>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setTab('enrollment'); handleRunEnrollQuery(c.courseName); }}>
                          View Roster →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: ENROLLMENT QUERY */}
          {tab === 'enrollment' && (
            <div>
              <div className="data-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>Course Enrollment Inspector</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Invokes Spring Boot native join query: <code>GET /Student/FindByCourse?courseName=...</code>
                </p>
                <div style={{ maxWidth: 360 }}>
                  <label className="form-label">Select Course Program</label>
                  <select className="form-control" value={enrollCourse} onChange={e => handleRunEnrollQuery(e.target.value)}>
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.courseName}>{c.courseName} ({c.duration || 'N/A'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="data-card">
                <div className="data-card-header">
                  <h3>Enrolled Roster for "{enrollCourse || 'None'}"</h3>
                </div>
                {enrollLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Executing query...</div>
                ) : enrollResults.length === 0 ? (
                  <div className="empty-state">
                    <h4>No students found</h4>
                    <p>Select another course or enroll students from the Directory.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>All Enrolled Courses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollResults.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div className="student-avatar-cell">
                                <div className="student-avatar" style={{ background: 'var(--grad-primary)' }}>
                                  {(s.name || 'S')[0].toUpperCase()}
                                </div>
                                <div style={{ fontWeight: 600 }}>{s.name || 'Student'}</div>
                              </div>
                            </td>
                            <td><span style={{ color: 'var(--text-muted)' }}>{s.email}</span></td>
                            <td>
                              <div className="course-tag-list">
                                {(s.course || s.courses || []).map((c, i) => (
                                  <span key={i} className={`course-tag ${c.courseName === enrollCourse ? 'emerald' : ''}`}>
                                    {c.courseName}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: API & SECURITY */}
          {tab === 'security' && (
            <div>
              <div className="data-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>JWT Session Token</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Bearer token transmitted to Spring Boot on each API call
                </p>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.8rem', color: '#a5b4fc', wordBreak: 'break-all' }}>
                  {token || 'No active JWT token. Click Sign In to generate one.'}
                </div>
              </div>

              <div className="data-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Backend Connection Endpoints</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: '#34d399' }}>POST</strong> <code>/auth/login</code>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Validates BCrypt hashed password and yields signed JWT.</p>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: '#22d3ee' }}>GET</strong> <code>/Student/getAll</code>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stateless JWT-authenticated student roster fetch.</p>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: '#34d399' }}>POST</strong> <code>/Student/save</code>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registers student and maps to course entity in MySQL.</p>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: '#22d3ee' }}>GET</strong> <code>/Course/getAll</code>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curriculum catalog query endpoint.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}

      {/* Modal: Auth */}
      {authModal.open && (
        <div className="modal-overlay" onClick={() => setAuthModal({ open: false, mode: 'signin' })}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className={`filter-chip ${authModal.mode === 'signin' ? 'active' : ''}`} onClick={() => setAuthModal({ open: true, mode: 'signin' })}>
                  Sign In
                </button>
                <button className={`filter-chip ${authModal.mode === 'register' ? 'active' : ''}`} onClick={() => setAuthModal({ open: true, mode: 'register' })}>
                  Create Account
                </button>
              </div>
              <button className="modal-close" onClick={() => setAuthModal({ open: false, mode: 'signin' })}>&times;</button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              <div className="modal-body">
                {authModal.mode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" type="text" placeholder="John Doe" value={authName} onChange={e => setAuthName(e.target.value)} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" placeholder="arham@gmail.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-control" type="password" placeholder="••••••••" value={authPass} onChange={e => setAuthPass(e.target.value)} required />
                </div>
                {authModal.mode === 'signin' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAuthEmail('arham@gmail.com'); setAuthPass('cdac'); showToast('Filled', 'Demo credentials loaded', 'info'); }}>
                      ⚡ Fill Demo Account (arham@gmail.com)
                    </button>
                  </div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {authModal.mode === 'signin' ? 'Sign In & Authenticate' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Student */}
      {studentModal.open && (
        <div className="modal-overlay" onClick={() => setStudentModal({ open: false, student: null })}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{studentModal.student ? `Edit Student #${studentModal.student.id}` : 'Register New Student'}</h3>
              <button className="modal-close" onClick={() => setStudentModal({ open: false, student: null })}>&times;</button>
            </div>
            <form onSubmit={handleSaveStudent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" type="text" placeholder="e.g. Maya Patel" value={studentName} onChange={e => setStudentName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-control" type="email" placeholder="maya.patel@example.com" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Courses</label>
                  <div className="courses-checkbox-group">
                    {courses.map(c => {
                      const isChecked = selectedCourses.includes(c.id);
                      return (
                        <label key={c.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCourses(prev => [...prev, c.id]);
                              else setSelectedCourses(prev => prev.filter(id => id !== c.id));
                            }}
                          />
                          <span>{c.courseName} <small style={{ color: 'var(--text-subtle)' }}>({c.duration})</small></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStudentModal({ open: false, student: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Course */}
      {courseModal && (
        <div className="modal-overlay" onClick={() => setCourseModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Course</h3>
              <button className="modal-close" onClick={() => setCourseModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input className="form-control" type="text" placeholder="e.g. Distributed Systems" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Program Duration</label>
                  <input className="form-control" type="text" placeholder="e.g. 6 Months / 12 Weeks" value={courseDuration} onChange={e => setCourseDuration(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCourseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Student Profile */}
      {profileModal.open && profileModal.student && (
        <div className="modal-overlay" onClick={() => setProfileModal({ open: false, student: null })}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button className="modal-close" onClick={() => setProfileModal({ open: false, student: null })}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="student-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', margin: '0 auto 0.75rem', background: 'var(--grad-primary)' }}>
                {(profileModal.student.name || 'S')[0].toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1.4rem' }}>{profileModal.student.name || 'Unnamed'}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{profileModal.student.email}</p>
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', textAlign: 'left' }}>
                <h5 style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Enrolled Programs
                </h5>
                {(profileModal.student.course || profileModal.student.courses || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.courseName}</span>
                    <span className="course-tag cyan">Active</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setProfileModal({ open: false, student: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deleteModal.open && deleteModal.target && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, target: null })}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-rose)' }}>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteModal({ open: false, target: null })}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)' }}>
                Are you sure you want to permanently delete "{deleteModal.target.name}"?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, target: null })}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
