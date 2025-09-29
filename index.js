const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes with error handling
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    console.log('📤 Serving index.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error('❌ index.html not found at:', filePath);
        res.status(404).send('index.html not found');
    }
});

app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'login.html');
    console.log('📤 Serving login.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error('❌ login.html not found at:', filePath);
        res.status(404).send('login.html not found');
    }
});

app.get('/signup', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'signup.html');
    console.log('📤 Serving signup.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error('❌ signup.html not found at:', filePath);
        res.status(404).send('signup.html not found');
    }
});

app.get('/dashboard', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'dashboard.html');
    console.log('📤 Serving dashboard.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.error('❌ dashboard.html not found at:', filePath);
        res.status(404).send('dashboard.html not found');
    }
});

// ==================== API ROUTES ====================

// Demo signup endpoint
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log('📝 Signup attempt:', { username, email });
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Simulate user creation
        const newUser = {
            id: Date.now(),
            username,
            email,
            level: 1,
            experience: 0,
            streakDays: 0,
            createdAt: new Date().toISOString()
        };

        console.log('✅ User created:', newUser.username);

        // Return success response
        res.json({
            message: 'User created successfully',
            user: newUser,
            token: 'demo-token-' + newUser.id
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ 
            message: 'Server error during registration' 
        });
    }
});

// Demo login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Login attempt:', { username });
        
        if (!username || !password) {
            return res.status(400).json({ 
                message: 'Username and password are required' 
            });
        }

        // Demo user validation
        if (password.length < 6) {
            return res.status(401).json({ 
                message: 'Invalid credentials' 
            });
        }

        // Create demo user
        const user = {
            id: Date.now(),
            username,
            level: 1,
            experience: 450,
            streakDays: 7,
            createdAt: new Date().toISOString()
        };

        console.log('✅ Login successful:', user.username);

        res.json({
            message: 'Login successful',
            user: user,
            token: 'demo-token-' + user.id
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login' 
        });
    }
});

// Demo user info endpoint
app.get('/api/auth/me', (req, res) => {
    // For demo purposes, return a sample user
    const user = {
        id: 1,
        username: 'DemoHunter',
        level: 1,
        experience: 450,
        streakDays: 7
    };
    
    res.json({ user });
});

// Demo quest endpoints
app.get('/api/quests', (req, res) => {
    const quests = [
        {
            id: 1,
            name: 'Complete Morning Routine',
            description: 'Finish your daily morning routine tasks',
            is_daily: true,
            is_completed: false,
            experience_value: 100
        },
        {
            id: 2,
            name: 'Study Programming', 
            description: 'Spend 1 hour learning new programming concepts',
            is_daily: true,
            is_completed: true,
            experience_value: 100
        }
    ];
    
    res.json({ quests });
});

app.get('/api/quests/daily', (req, res) => {
    const quests = [
        {
            id: 1,
            name: 'Complete Morning Routine',
            description: 'Finish your daily morning routine tasks',
            is_daily: true,
            is_completed: false,
            experience_value: 100
        },
        {
            id: 2,
            name: 'Study Programming',
            description: 'Spend 1 hour learning new programming concepts', 
            is_daily: true,
            is_completed: true,
            experience_value: 100
        },
        {
            id: 3,
            name: 'Exercise Session',
            description: 'Complete 30 minutes of physical exercise',
            is_daily: true,
            is_completed: false,
            experience_value: 100
        }
    ];
    
    res.json({ quests });
});

app.post('/api/quests', (req, res) => {
    const { name, description, isDaily } = req.body;
    
    const newQuest = {
        id: Date.now(),
        name,
        description,
        is_daily: isDaily,
        is_completed: false,
        experience_value: 100
    };
    
    res.json({
        message: 'Quest created successfully',
        quest: newQuest
    });
});

app.post('/api/quests/:id/complete', (req, res) => {
    const { completed } = req.body;
    
    res.json({
        message: `Quest marked as ${completed ? 'completed' : 'pending'}`
    });
});

app.post('/api/quests/reset-daily', (req, res) => {
    res.json({
        message: 'Daily quests reset successfully'
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.json({
        message: 'Logout successful'
    });
});

// Test routes
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '✅ Server is working!',
        timestamp: new Date().toISOString(),
        publicPath: path.join(__dirname, 'public')
    });
});

app.get('/debug/files', (req, res) => {
    try {
        const files = fs.readdirSync(path.join(__dirname, 'public'));
        res.json({ files });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', server: 'Clinex Leveling' });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🎯 Clinex Leveling System running at http://localhost:${PORT}`);
    console.log(`📁 Project path: ${__dirname}`);
    
    // List public files
    try {
        const publicFiles = fs.readdirSync(path.join(__dirname, 'public'));
        console.log(`📄 Public files (${publicFiles.length}):`, publicFiles);
    } catch (error) {
        console.error('❌ Cannot read public folder:', error.message);
    }
    
    console.log(`\n🔗 Test URLs:`);
    console.log(`   Main Site: http://localhost:${PORT}/`);
    console.log(`   API Test:  http://localhost:${PORT}/api/test`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
    console.log(`\n🔐 API Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/quests`);
});