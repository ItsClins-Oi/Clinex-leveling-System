// script.js - Clinex Leveling Client-Side Functionality

// API Base URL (will be set based on environment)
const API_BASE = window.location.origin + '/api';

// Global state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupGlobalEventListeners();
});

// Initialize application based on current page
function initializeApp() {
    const path = window.location.pathname;
    
    switch(path) {
        case '/':
        case '/index.html':
            initLandingPage();
            break;
        case '/login':
        case '/login.html':
            initLoginPage();
            break;
        case '/signup':
        case '/signup.html':
            initSignupPage();
            break;
        case '/dashboard':
        case '/dashboard.html':
            initDashboardPage();
            break;
        default:
            // Check if user is authenticated for protected pages
            if (path !== '/' && path !== '/login' && path !== '/signup') {
                checkAuthentication();
            }
    }
}

// ==================== AUTHENTICATION FUNCTIONS ====================

// Check if user is authenticated
async function checkAuthentication() {
    if (!authToken) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }

        const data = await response.json();
        currentUser = data.user;
        return true;
    } catch (error) {
        localStorage.removeItem('authToken');
        authToken = null;
        redirectToLogin();
        return false;
    }
}

// Redirect to login page
function redirectToLogin() {
    if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
    }
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = data.user;

        showToast('System Access Granted', 'Welcome back to Clinex Leveling!', 'success');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);

        return data;
    } catch (error) {
        showToast('Access Denied', error.message, 'error');
        throw error;
    }
}

// Signup function
async function signup(username, email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }

        showToast('Hunter Registration Complete', 'Welcome to Clinex Leveling!', 'success');
        
        // Auto-login after signup
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);

        return data;
    } catch (error) {
        showToast('Registration Failed', error.message, 'error');
        throw error;
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        window.location.href = '/';
    }
}

// ==================== QUEST MANAGEMENT FUNCTIONS ====================

// Get all quests
async function getQuests() {
    try {
        const response = await fetch(`${API_BASE}/quests`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch quests');
        
        const data = await response.json();
        return data.quests;
    } catch (error) {
        console.error('Error fetching quests:', error);
        showToast('Error', 'Failed to load quests', 'error');
        return [];
    }
}

// Get daily quests
async function getDailyQuests() {
    try {
        const response = await fetch(`${API_BASE}/quests/daily`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch daily quests');
        
        const data = await response.json();
        return data.quests;
    } catch (error) {
        console.error('Error fetching daily quests:', error);
        return [];
    }
}

// Create new quest
async function createQuest(questData) {
    try {
        const response = await fetch(`${API_BASE}/quests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create quest');
        }

        showToast('Quest Created!', 'Your new quest has been added to the system.', 'success');
        return data.quest;
    } catch (error) {
        showToast('Failed to create quest', error.message, 'error');
        throw error;
    }
}

// Update quest completion status
async function updateQuestCompletion(questId, completed) {
    try {
        const response = await fetch(`${API_BASE}/quests/${questId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });

        if (!response.ok) throw new Error('Failed to update quest');
        
        const data = await response.json();
        showToast('Quest Updated!', `Quest marked as ${completed ? 'completed' : 'pending'}.`, 'success');
        return data;
    } catch (error) {
        showToast('Error', 'Failed to update quest', 'error');
        throw error;
    }
}

// Reset daily quests
async function resetDailyQuests() {
    try {
        const response = await fetch(`${API_BASE}/quests/reset-daily`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to reset daily quests');
        
        showToast('Daily Reset Complete', 'All daily quests have been reset.', 'success');
        return true;
    } catch (error) {
        showToast('Error', 'Failed to reset daily quests', 'error');
        throw error;
    }
}

// ==================== NOTIFICATION SYSTEM ====================

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
                return true;
            }
        });
    }

    return false;
}

// Show browser notification
function showBrowserNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico'
        });
    }
}

// Show toast notification
function showToast(title, message, type = 'success') {
    // Create toast element if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        background: var(--card);
        border: 1px solid ${type === 'error' ? 'var(--destructive)' : 'var(--border)'};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;

    toast.innerHTML = `
        <div class="toast-title" style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div class="toast-message" style="font-size: 14px; color: var(--muted-foreground);">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations for toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyles);

// ==================== PAGE-SPECIFIC INITIALIZERS ====================

function initLandingPage() {
    // Add any landing page specific functionality
    console.log('Initialized landing page');
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            
            const originalText = submitText.textContent;
            submitBtn.disabled = true;
            submitText.textContent = 'Accessing...';
            
            try {
                await login(username, password);
            } catch (error) {
                // Error handled in login function
            } finally {
                submitBtn.disabled = false;
                submitText.textContent = originalText;
            }
        });
    }
}

function initSignupPage() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            
            const originalText = submitText.textContent;
            submitBtn.disabled = true;
            submitText.textContent = 'Creating...';
            
            try {
                await signup(username, email, password);
            } catch (error) {
                // Error handled in signup function
            } finally {
                submitBtn.disabled = false;
                submitText.textContent = originalText;
            }
        });
    }
}

function initDashboardPage() {
    // Check authentication first
    checkAuthentication().then(async (authenticated) => {
        if (!authenticated) return;

        // Load dashboard data
        await loadDashboardData();
        setupDashboardEventListeners();
        requestNotificationPermission();
        
        // Show welcome notification
        const dailyQuests = await getDailyQuests();
        const pendingQuests = dailyQuests.filter(q => !q.completed).length;
        
        showBrowserNotification(
            'Clinex Leveling System',
            `Welcome back, ${currentUser.username}! You have ${pendingQuests} daily quests available.`
        );
    });
}

async function loadDashboardData() {
    try {
        const [quests, dailyQuests] = await Promise.all([
            getQuests(),
            getDailyQuests()
        ]);

        updateDashboardUI(quests, dailyQuests);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardUI(quests, dailyQuests) {
    // Update user stats
    updateUserStats();
    
    // Update quests display
    updateQuestsDisplay(quests, dailyQuests);
    
    // Update quest log
    updateQuestLog(quests);
}

function updateUserStats() {
    // This would update the user interface with current user data
    const userNameEl = document.getElementById('userName');
    const userStatsEl = document.getElementById('userStats');
    const expProgressEl = document.getElementById('expProgress');
    const expTextEl = document.getElementById('expText');
    
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.username;
        userStatsEl.textContent = `Level ${currentUser.level} • Daily Streak: ${currentUser.streakDays} days`;
        
        const expPercent = ((currentUser.experience % 1000) / 1000) * 100;
        expProgressEl.style.width = `${expPercent}%`;
        expTextEl.textContent = `${currentUser.experience % 1000}/1000`;
    }
}

function updateQuestsDisplay(quests, dailyQuests) {
    // Implementation for updating the quests display
    const container = document.getElementById('dailyQuestsContainer');
    if (!container) return;

    const completedToday = dailyQuests.filter(q => q.completed).length;
    document.getElementById('statCompletedToday').textContent = completedToday;
    document.getElementById('statTotalQuests').textContent = quests.length;
    document.getElementById('dailyQuestCount').textContent = `${completedToday} of ${dailyQuests.length} completed`;

    // Render quests...
}

function updateQuestLog(quests) {
    // Implementation for updating the quest log
    const container = document.getElementById('questLogContainer');
    if (!container) return;

    // Render quest log...
}

function setupDashboardEventListeners() {
    // Quest creation form
    const createQuestForm = document.getElementById('createQuestForm');
    if (createQuestForm) {
        createQuestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateQuest();
        });
    }

    // System buttons
    const resetDailyBtn = document.getElementById('resetDailyBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exitSystemBtn = document.getElementById('exitSystemBtn');

    if (resetDailyBtn) {
        resetDailyBtn.addEventListener('click', async () => {
            await resetDailyQuests();
            await loadDashboardData(); // Refresh data
        });
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportUserData);
    }

    if (exitSystemBtn) {
        exitSystemBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit the Clinex Leveling system?')) {
                logout();
            }
        });
    }
}

async function handleCreateQuest() {
    const nameInput = document.getElementById('quest-name');
    const descInput = document.getElementById('quest-description');
    const dailyCheckbox = document.getElementById('dailyCheckbox');
    
    const questData = {
        name: nameInput.value.trim(),
        description: descInput.value.trim(),
        isDaily: dailyCheckbox?.classList.contains('checked') || false
    };

    if (!questData.name) return;

    try {
        await createQuest(questData);
        
        // Reset form
        nameInput.value = '';
        if (descInput) descInput.value = '';
        if (dailyCheckbox) dailyCheckbox.classList.remove('checked');
        
        // Reload dashboard data
        await loadDashboardData();
    } catch (error) {
        // Error handled in createQuest function
    }
}

function exportUserData() {
    // Implementation for exporting user data
    const data = {
        user: currentUser,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinex-leveling-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data Exported', 'Your Clinex Leveling data has been downloaded.');
}

// ==================== UTILITY FUNCTIONS ====================

function setupGlobalEventListeners() {
    // Global click handler for delegated events
    document.addEventListener('click', function(e) {
        // Handle quest completion toggles
        if (e.target.classList.contains('quest-checkbox')) {
            const questId = e.target.dataset.questId;
            const completed = e.target.classList.contains('checked');
            toggleQuestCompletion(questId, !completed);
        }
        
        // Handle logout buttons
        if (e.target.closest('.logout-btn')) {
            e.preventDefault();
            logout();
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        initializeApp();
    });
}

async function toggleQuestCompletion(questId, completed) {
    try {
        await updateQuestCompletion(questId, completed);
        await loadDashboardData(); // Refresh the dashboard
    } catch (error) {
        // Error handled in updateQuestCompletion
    }
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('System Error', 'An unexpected error occurred', 'error');
});

// Export functions for use in HTML (if needed)
window.ClinexLeveling = {
    login,
    signup,
    logout,
    createQuest,
    updateQuestCompletion,
    showToast,
    requestNotificationPermission
};

console.log('Clinex Leveling script loaded successfully');
