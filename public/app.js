// --- Authentication Utilities ---
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function checkAuth(allowedRoles = []) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = '/login.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on role if unauthorized
    if (user.role === 'admin') window.location.href = '/admin-dashboard.html';
    else if (user.role === 'teacher') window.location.href = '/teacher-dashboard.html';
    else window.location.href = '/login.html';
    return null;
  }

  return user;
}

// --- API Wrapper ---
// Allows pointing API requests to a remote server when running in a WebView
// Set window.API_BASE_URL in your WebView's injected JavaScript or HTML before scripts load
const API_BASE_URL = window.API_BASE_URL || '';

async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // If uploading file, removing Content-Type lets browser set it with boundary
  if (options.body instanceof FormData) {
    delete defaultHeaders['Content-Type'];
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
    
    // For blob responses (like Excel export)
    if (response.headers.get('content-type')?.includes('spreadsheetml')) {
      if (!response.ok) throw new Error('Failed to download file');
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        logout(); // Auto logout on invalid token
      }
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

// --- UI Utilities ---
function showLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.add('active');
}

function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.classList.remove('active');
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Set up UI components (Sidebar, Topbar)
function setupUI(user) {
  // Set User Info
  const userNames = document.querySelectorAll('.user-name-display');
  const userRoles = document.querySelectorAll('.user-role-display');
  const userInitials = document.querySelectorAll('.user-initial-display');

  userNames.forEach(el => el.textContent = user.name || 'User');
  userRoles.forEach(el => el.textContent = user.role === 'admin' ? 'Administrator' : user.subject || 'Teacher');
  userInitials.forEach(el => el.textContent = (user.name || 'U').charAt(0).toUpperCase());

  // Setup Sidebar Toggle for mobile
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Setup Logout
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      logout();
    });
  });

  // Highlight active nav item
  const currentPath = window.location.pathname.split('/').pop();
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      item.classList.add('active');
    }
  });
}

// Modal logic
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});
