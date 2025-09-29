// ==================== CONFIGURATION ====================
const API_BASE = window.location.origin + '/api';
const APP_VERSION = '1.0.0';
const DEMO_MODE = true; // Enable demo mode since we're using demo endpoints

// Demo data for when API is not available
const DEMO_USERS = [
    {
        id: 1,
        username: 'admin',
        password: 'password123',
        email: 'admin@clinex.com',
        level: 5,
        experience: 1250,
        streakDays: 14
    }
];
// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Clinex Leveling System Initializing...');
    initializeApp();
    setupGlobalEventListeners();
    requestNotificationPermission();
});

function initializeApp() {
    const path = window.location.pathname;
    console.log('Initializing page:', path);
    
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
            console.log('Unknown page, using landing page logic');
            initLandingPage();
    }
}

// ==================== AUTHENTICATION FUNCTIONS ====================
async function checkAuthentication() {
    if (!authToken) {
        console.log('No auth token found, redirecting to login');
        redirectToLogin();
        return false;
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
        console.log('User authenticated:', currentUser.username);
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        localStorage.removeItem('clinexAuthToken');
        authToken = null;
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    if (!window.location.pathname.includes('login') && 
        !window.location.pathname.includes('signup') &&
        !window.location.pathname.includes('index')) {
        window.location.href = '/login';
    }
}

async function login(username, password) {
    try {
        showLoadingState('login');
        
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

        // Store authentication data
        authToken = data.token;
        localStorage.setItem('clinexAuthToken', authToken);
        currentUser = data.user;

        showToast('⚡ System Access Granted', 'Welcome back to Clinex Leveling!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);

        return data;
    } catch (error) {
        showToast('🚫 Access Denied', error.message, 'error');
        throw error;
    } finally {
        hideLoadingState('login');
    }
}

async function signup(username, email, password) {
    try {
        showLoadingState('signup');
        
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

        showToast('🎉 Hunter Registration Complete', 'Welcome to Clinex Leveling! Redirecting to login...', 'success');
        
        // Redirect to login after successful signup
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);

        return data;
    } catch (error) {
        showToast('❌ Registration Failed', error.message, 'error');
        throw error;
    } finally {
        hideLoadingState('signup');
    }
}

async function logout() {
    try {
        if (authToken) {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local data
        localStorage.removeItem('clinexAuthToken');
        authToken = null;
        currentUser = null;
        allQuests = [];
        dailyQuests = [];
        
        showToast('👋 System Exit', 'Logged out successfully', 'info');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// ==================== QUEST MANAGEMENT ====================
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
        allQuests = data.quests || [];
        return allQuests;
    } catch (error) {
        console.error('Error fetching quests:', error);
        // For demo purposes, return sample data
        return getSampleQuests();
    }
}

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
        dailyQuests = data.quests || [];
        return dailyQuests;
    } catch (error) {
        console.error('Error fetching daily quests:', error);
        // For demo purposes, return sample daily quests
        return getSampleQuests().filter(quest => quest.isDaily);
    }
}

async function createQuest(questData) {
    try {
        showLoadingState('createQuest');
        
        // For demo - simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newQuest = {
            id: 'quest_' + Date.now(),
            name: questData.name,
            description: questData.description,
            isDaily: questData.isDaily || false,
            completed: false,
            createdAt: new Date().toISOString(),
            experience: 100
        };

        // Add to local arrays
        allQuests.push(newQuest);
        if (newQuest.isDaily) {
            dailyQuests.push(newQuest);
        }

        showToast('🎯 Quest Created!', 'Your new quest has been added to the system.', 'success');
        return newQuest;
    } catch (error) {
        showToast('❌ Failed to create quest', error.message, 'error');
        throw error;
    } finally {
        hideLoadingState('createQuest');
    }
}

async function updateQuestCompletion(questId, completed) {
    try {
        // For demo - simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update quest in local arrays
        allQuests = allQuests.map(quest => 
            quest.id === questId ? { ...quest, completed } : quest
        );
        
        dailyQuests = dailyQuests.map(quest => 
            quest.id === questId ? { ...quest, completed } : quest
        );

        // Update user experience for demo
        if (currentUser && completed) {
            currentUser.experience += 100;
            if (currentUser.experience >= 1000) {
                currentUser.level += 1;
                currentUser.experience = 0;
                showToast('🎊 Level Up!', `Congratulations! You reached level ${currentUser.level}.`, 'success');
            }
        }

        showToast('✅ Quest Updated!', `Quest marked as ${completed ? 'completed' : 'pending'}.`, 'success');
        return true;
    } catch (error) {
        showToast('❌ Error', 'Failed to update quest', 'error');
        throw error;
    }
}

async function resetDailyQuests() {
    try {
        showLoadingState('resetQuests');
        
        // For demo - simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reset all daily quests
        dailyQuests = dailyQuests.map(quest => ({
            ...quest,
            completed: false
        }));

        allQuests = allQuests.map(quest => 
            quest.isDaily ? { ...quest, completed: false } : quest
        );

        showToast('🔄 Daily Reset Complete', 'All daily quests have been reset.', 'success');
        return true;
    } catch (error) {
        showToast('❌ Error', 'Failed to reset daily quests', 'error');
        throw error;
    } finally {
        hideLoadingState('resetQuests');
    }
}

// ==================== PAGE INITIALIZERS ====================
function initLandingPage() {
    console.log('Initializing landing page');
    // Add any landing page specific interactions
    setupParticleEffect();
}

function initLoginPage() {
    console.log('Initializing login page');
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username')?.value;
            const password = document.getElementById('password')?.value;
            
            if (!username || !password) {
                showToast('❌ Missing Information', 'Please fill in all fields', 'error');
                return;
            }

            try {
                await login(username, password);
            } catch (error) {
                // Error already handled in login function
            }
        });
    }

    // Update security level indicator
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('input', updateSecurityLevel);
        });
    }
}

function initSignupPage() {
    console.log('Initializing signup page');
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username')?.value;
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;

            if (!username || !email || !password) {
                showToast('❌ Missing Information', 'Please fill in all fields', 'error');
                return;
            }

            try {
                await signup(username, email, password);
            } catch (error) {
                // Error already handled in signup function
            }
        });
    }
}

async function initDashboardPage() {
    console.log('Initializing dashboard page');
    
    // Check authentication first
    const authenticated = await checkAuthentication();
    if (!authenticated) return;

    // For demo - create sample user if none exists
    if (!currentUser) {
        currentUser = {
            id: 'user_1',
            username: 'DemoHunter',
            email: 'demo@clinex.com',
            level: 1,
            experience: 450,
            streakDays: 7,
            createdAt: new Date().toISOString()
        };
    }

    // Load dashboard data
    await loadDashboardData();
    setupDashboardEventListeners();
    
    // Show welcome notification
    const pendingQuests = dailyQuests.filter(q => !q.completed).length;
    showBrowserNotification(
        '⚡ Clinex Leveling System',
        `Welcome back, ${currentUser.username}! You have ${pendingQuests} daily quests available.`
    );
}

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        const [quests, daily] = await Promise.all([
            getQuests(),
            getDailyQuests()
        ]);

        updateDashboardUI(quests, daily);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('❌ Error', 'Failed to load dashboard data', 'error');
    }
}

function updateDashboardUI(quests, dailyQuests) {
    updateUserStats();
    updateQuestsDisplay(quests, dailyQuests);
    updateQuestLog(quests);
}

function updateUserStats() {
    if (!currentUser) return;

    // Update user info elements
    const elements = {
        userName: document.getElementById('userName'),
        userStats: document.getElementById('userStats'),
        expProgress: document.getElementById('expProgress'),
        expText: document.getElementById('expText'),
        navWelcome: document.getElementById('navWelcome'),
        statCompletedToday: document.getElementById('statCompletedToday'),
        statTotalQuests: document.getElementById('statTotalQuests'),
        statStreak: document.getElementById('statStreak')
    };

    if (elements.userName) elements.userName.textContent = currentUser.username;
    if (elements.userStats) elements.userStats.textContent = `Level ${currentUser.level} • Daily Streak: ${currentUser.streakDays} days`;
    if (elements.navWelcome) elements.navWelcome.textContent = `Welcome back, ${currentUser.username}`;
    
    const expPercent = ((currentUser.experience % 1000) / 1000) * 100;
    if (elements.expProgress) elements.expProgress.style.width = `${expPercent}%`;
    if (elements.expText) elements.expText.textContent = `${currentUser.experience % 1000}/1000`;
    
    const completedToday = dailyQuests.filter(q => q.completed).length;
    if (elements.statCompletedToday) elements.statCompletedToday.textContent = completedToday;
    if (elements.statTotalQuests) elements.statTotalQuests.textContent = allQuests.length;
    if (elements.statStreak) elements.statStreak.textContent = currentUser.streakDays;
}

function updateQuestsDisplay(quests, dailyQuests) {
    const container = document.getElementById('dailyQuestsContainer');
    if (!container) return;

    const completedToday = dailyQuests.filter(q => q.completed).length;
    const dailyQuestCountEl = document.getElementById('dailyQuestCount');
    if (dailyQuestCountEl) {
        dailyQuestCountEl.textContent = `${completedToday} of ${dailyQuests.length} completed`;
    }

    // Clear container
    container.innerHTML = '';

    if (dailyQuests.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-muted-foreground">
                <span class="icon-scroll" style="font-size: 3rem; opacity: 0.5;">📜</span>
                <p class="mt-4">No daily quests available. Create some quests and mark them as daily!</p>
            </div>
        `;
        return;
    }

    // Render each daily quest
    dailyQuests.forEach(quest => {
        const questElement = document.createElement('div');
        questElement.className = 'quest-item p-4 bg-card rounded border border-border hover:border-primary transition-colors';
        questElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="font-medium flex items-center">
                        <span class="mr-2">${quest.completed ? '✅' : '🎯'}</span>
                        ${quest.name}
                    </div>
                    <div class="text-sm text-muted-foreground mt-1">${quest.description || 'No description'}</div>
                </div>
                <div class="flex items-center space-x-3 ml-4">
                    <div class="quest-checkbox ${quest.completed ? 'checked' : ''}" 
                         data-quest-id="${quest.id}"
                         style="width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: ${quest.completed ? 'var(--primary)' : 'transparent'}">
                        ${quest.completed ? '✓' : ''}
                    </div>
                    <span class="text-xs text-muted-foreground">${quest.completed ? 'Completed' : 'Pending'}</span>
                </div>
            </div>
        `;
        container.appendChild(questElement);
    });
}

function updateQuestLog(quests) {
    const container = document.getElementById('questLogContainer');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    if (quests.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted-foreground">
                <span class="icon-book" style="font-size: 2rem; opacity: 0.5;">📚</span>
                <p class="text-sm mt-2">No quests created yet</p>
            </div>
        `;
        return;
    }

    // Render quest log
    quests.forEach(quest => {
        const questElement = document.createElement('div');
        questElement.className = 'flex items-center justify-between p-3 bg-card rounded border border-border';
        questElement.innerHTML = `
            <div class="flex-1">
                <div class="font-medium text-sm flex items-center">
                    <span class="mr-2">${quest.isDaily ? '🔄' : '⭐'}</span>
                    ${quest.name}
                </div>
                <div class="text-xs text-muted-foreground">
                    ${quest.isDaily ? 'Daily' : 'One-time'} • ${quest.completed ? '✅ Completed' : '⏳ Pending'}
                </div>
            </div>
            <div class="text-xs text-muted-foreground">
                +${quest.experence || 100} EXP
            </div>
        `;
        container.appendChild(questElement);
    });
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

    // Daily checkbox
    const dailyCheckbox = document.getElementById('dailyCheckbox');
    if (dailyCheckbox) {
        let isDailyChecked = false;
        dailyCheckbox.addEventListener('click', function() {
            isDailyChecked = !isDailyChecked;
            this.classList.toggle('checked', isDailyChecked);
            this.textContent = isDailyChecked ? '✓' : '';
            this.style.background = isDailyChecked ? 'var(--primary)' : 'transparent';
        });
    }

    // System buttons
    const resetDailyBtn = document.getElementById('resetDailyBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exitSystemBtn = document.getElementById('exitSystemBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (resetDailyBtn) {
        resetDailyBtn.addEventListener('click', async () => {
            if (confirm('Reset all daily quests to pending?')) {
                await resetDailyQuests();
                await loadDashboardData();
            }
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }

    // Quest completion handlers (delegated)
    const dailyQuestsContainer = document.getElementById('dailyQuestsContainer');
    if (dailyQuestsContainer) {
        dailyQuestsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('quest-checkbox')) {
                const questId = e.target.getAttribute('data-quest-id');
                const isCompleted = e.target.classList.contains('checked');
                toggleQuestCompletion(questId, !isCompleted);
            }
        });
    }
}

async function handleCreateQuest() {
    const nameInput = document.getElementById('quest-name');
    const descInput = document.getElementById('quest-description');
    const dailyCheckbox = document.getElementById('dailyCheckbox');
    
    if (!nameInput) {
        showToast('❌ Error', 'Quest name input not found', 'error');
        return;
    }

    const questData = {
        name: nameInput.value.trim(),
        description: descInput ? descInput.value.trim() : '',
        isDaily: dailyCheckbox ? dailyCheckbox.classList.contains('checked') : false
    };

    if (!questData.name) {
        showToast('❌ Missing Information', 'Please enter a quest name', 'error');
        return;
    }

    try {
        await createQuest(questData);
        
        // Reset form
        nameInput.value = '';
        if (descInput) descInput.value = '';
        if (dailyCheckbox) {
            dailyCheckbox.classList.remove('checked');
            dailyCheckbox.textContent = '';
            dailyCheckbox.style.background = 'transparent';
        }
        
        // Reload dashboard data
        await loadDashboardData();
    } catch (error) {
        // Error handled in createQuest function
    }
}

async function toggleQuestCompletion(questId, completed) {
    try {
        await updateQuestCompletion(questId, completed);
        await loadDashboardData(); // Refresh the dashboard
    } catch (error) {
        // Error handled in updateQuestCompletion
    }
}

// ==================== UTILITY FUNCTIONS ====================
function setupGlobalEventListeners() {
    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        showToast('⚡ System Error', 'An unexpected error occurred', 'error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        showToast('⚡ System Error', 'An unexpected error occurred', 'error');
    });
}

function updateSecurityLevel() {
    const username = document.getElementById('username')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const progress = document.getElementById('securityProgress');
    
    if (!progress) return;

    let securityLevel = 0;
    if (username.length > 0) securityLevel += 30;
    if (password.length > 0) securityLevel += 30;
    if (username.length > 3) securityLevel += 20;
    if (password.length > 5) securityLevel += 20;
    
    progress.style.width = Math.min(securityLevel, 100) + '%';
}

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

function showBrowserNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }
}

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(title, message, type = 'success') {
    // Create toast container if it doesn't exist
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
        background: var(--card, #1a1a3a);
        border: 1px solid ${type === 'error' ? 'var(--destructive, #ff4444)' : 'var(--border, #2a2a4a)'};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        backdrop-filter: blur(10px);
    `;

    toast.innerHTML = `
        <div class="toast-title" style="font-weight: 600; margin-bottom: 4px; color: var(--foreground, #ffffff);">${title}</div>
        <div class="toast-message" style="font-size: 14px; color: var(--muted-foreground, #a0a0a0);">${message}</div>
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

// ==================== LOADING STATES ====================
function showLoadingState(context) {
    const elements = {
        login: { btn: document.querySelector('#loginForm button[type="submit"]'), text: 'Accessing System...' },
        signup: { btn: document.querySelector('#signupForm button[type="submit"]'), text: 'Creating Account...' },
        createQuest: { btn: document.getElementById('createQuestBtn'), text: 'Creating Quest...' },
        resetQuests: { btn: document.getElementById('resetDailyBtn'), text: 'Resetting...' }
    };

    const element = elements[context];
    if (element && element.btn) {
        element.btn.disabled = true;
        const originalText = element.btn.textContent;
        element.btn.setAttribute('data-original-text', originalText);
        element.btn.textContent = element.text;
    }
}

function hideLoadingState(context) {
    const elements = {
        login: { btn: document.querySelector('#loginForm button[type="submit"]') },
        signup: { btn: document.querySelector('#signupForm button[type="submit"]') },
        createQuest: { btn: document.getElementById('createQuestBtn') },
        resetQuests: { btn: document.getElementById('resetDailyBtn') }
    };

    const element = elements[context];
    if (element && element.btn) {
        element.btn.disabled = false;
        const originalText = element.btn.getAttribute('data-original-text');
        if (originalText) {
            element.btn.textContent = originalText;
        }
    }
}

// ==================== DEMO/SAMPLE DATA ====================
function getSampleQuests() {
    return [
        {
            id: 'quest_1',
            name: 'Complete Morning Routine',
            description: 'Finish your daily morning routine tasks',
            isDaily: true,
            completed: false,
            createdAt: new Date().toISOString(),
            experience: 100
        },
        {
            id: 'quest_2',
            name: 'Study Programming',
            description: 'Spend 1 hour learning new programming concepts',
            isDaily: true,
            completed: true,
            createdAt: new Date().toISOString(),
            experience: 100
        },
        {
            id: 'quest_3',
            name: 'Exercise Session',
            description: 'Complete 30 minutes of physical exercise',
            isDaily: true,
            completed: false,
            createdAt: new Date().toISOString(),
            experience: 100
        },
        {
            id: 'quest_4',
            name: 'Project Milestone',
            description: 'Reach the next milestone in your main project',
            isDaily: false,
            completed: false,
            createdAt: new Date().toISOString(),
            experience: 250
        }
    ];
}

function exportUserData() {
    const data = {
        user: currentUser,
        quests: allQuests,
        dailyQuests: dailyQuests,
        exportedAt: new Date().toISOString(),
        version: APP_VERSION,
        system: 'Clinex Leveling'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinex-leveling-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('💾 Data Exported', 'Your Clinex Leveling data has been downloaded.', 'success');
}

function setupParticleEffect() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: var(--primary, #00ffff);
            border-radius: 50%;
            opacity: ${Math.random() * 0.3 + 0.1};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 3 + 3}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// ==================== GLOBAL EXPORTS ====================
window.ClinexLeveling = {
    login,
    signup,
    logout,
    createQuest,
    updateQuestCompletion,
    showToast,
    requestNotificationPermission,
    getQuests,
    getDailyQuests,
    resetDailyQuests,
    exportUserData
};

console.log('⚡ Clinex Leveling System - Client-side script loaded successfully!');