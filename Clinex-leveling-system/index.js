const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variable for session secret
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database configuration
const db = new sqlite3.Database(process.env.DATABASE_URL || './database.db');

app.listen(PORT, () => {
    console.log(`Solo Leveling Quest System running on port ${PORT}`);
});
// Serve custom 404 page for undefined routes
app.get('*', (req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
