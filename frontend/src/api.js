/**
 * API Service for AuraEdu React Frontend
 * Connects to Spring Boot backend running on port 8080 (via Vite proxy or direct CORS)
 */

// If running on Vite dev server (e.g. port 5173), Vite proxies /auth, /Student, /Course to http://localhost:8080
const API_BASE = '';

export function getToken() {
  return localStorage.getItem('aura_jwt_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('aura_jwt_token', token);
  } else {
    localStorage.removeItem('aura_jwt_token');
  }
}

export function getUser() {
  const data = localStorage.getItem('aura_user');
  return data ? JSON.parse(data) : null;
}

export function setUser(user) {
  if (user) {
    localStorage.setItem('aura_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('aura_user');
  }
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401 || res.status === 403) {
    const error = new Error('Authentication required or session expired.');
    error.status = res.status;
    throw error;
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text);
      msg = json.message || json.error || text;
    } catch (e) {}
    throw new Error(msg || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return await res.text();
}

// Authentication
export async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const token = typeof res === 'string' ? res.trim().replace(/^"|"$/g, '') : res;
  setToken(token);
  const user = { email, name: email.split('@')[0] };
  setUser(user);
  return { token, user };
}

export async function register(name, email, password) {
  return await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Backend logout notification error:', err);
  } finally {
    setToken('');
    setUser(null);
  }
}

// Students
export async function getStudents() {
  return await request('/Student/getAll');
}

export async function getStudentById(id) {
  return await request(`/Student/getbyid/${id}`);
}

export async function addStudent(student) {
  return await request('/Student/save', {
    method: 'POST',
    body: JSON.stringify(student)
  });
}

export async function updateStudent(id, student) {
  return await request(`/Student/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(student)
  });
}

export async function deleteStudent(id) {
  return await request(`/Student/delete/${id}`, {
    method: 'DELETE'
  });
}

export async function getStudentsByCourse(courseName) {
  return await request(`/Student/FindByCourse?courseName=${encodeURIComponent(courseName)}`);
}

// Courses
export async function getCourses() {
  return await request('/Course/getAll');
}

export async function addCourse(course) {
  return await request('/Course/save', {
    method: 'POST',
    body: JSON.stringify(course)
  });
}

export async function deleteCourse(id) {
  return await request(`/Course/delete/${id}`, {
    method: 'DELETE'
  });
}
