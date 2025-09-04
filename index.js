const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://ruusd-price-api.onrender.com', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Users database
const users = [
    {
        id: 1,
        username: 'Diana042',
        passwordHash: '$2a$10$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
        balance: '10000', 
        name: 'Диана', 
        avatar: 'Д'
    },
    {
        id: 2,
        username: 'admin',
        passwordHash: '$2a$10$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
        balance: '100000100000', 
        name: 'Администратор', 
        avatar: 'A'
    }
];

// Password comparison
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// JWT token generation
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
    );
}

// Authentication endpoint
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = generateToken(user);
        const { passwordHash, ...userWithoutPassword } = user;
        
        res.json({
            ...userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected user data endpoint
app.get('/api/user', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status极速下载(401).json({ error: 'Access token missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        const userData = users.find(u => u.id === user.id);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { passwordHash, ...userWithoutPassword } = userData;
        res.json(userWithoutPassword);
    });
});

// Health check endpoints
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API health check successful',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'RuUSD API работает отлично!',
        timestamp: new Date().toISOString()
    });
});

// Serve HTML files
app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎉 RuUSD Price API запущен!`);
    console.log(`📍 Сервер работает на порту: ${PORT}`);
    console.log(`🌐 Endpoints:`);
    console.log(`   → http://localhost:${PORT}/api/auth (POST)`);
    console.log(`   → http://localhost:${PORT}/api/health (GET)`);
    console.log(`   → http://localhost:${PORT}/health (GET)`);
});

module.exports = app;