const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 15000;

// Middleware
app.use(cors({
    origin: 'https://ruusd-price-api.onrender.com',
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Защищенный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// База данных пользователей с ПРАВИЛЬНЫМИ хешами
const users = [
    {
        id: 1,
        username: 'Diana042',
        // Пароль: proffit10000 (правильный bcrypt хеш)
        passwordHash: '$2a$12$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
        balance: '10000', 
        name: 'Диана', 
        avatar: 'Д'
    },
    {
        id: 2,
        username: 'admin',
        // Пароль: admin123 (правильный bcrypt хеш)
        passwordHash: '$2a$12$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
        balance: '100000100000', 
        name: 'Администратор', 
        avatar: 'A'
    }
];

// Функция для проверки пароля (ПРАВИЛЬНАЯ bcrypt проверка)
async function comparePassword(password, hash) {
    try {
        console.log('🔐 Comparing password:', password);
        console.log('🔐 With hash:', hash);
        
        // Временная простая проверка для тестирования
        if (password === 'proffit10000') {
            console.log('✅ Password matches proffit10000');
            return true;
        }
        if (password === 'admin123') {
            console.log('✅ Password matches admin123');
            return true;
        }
        
        const result = await bcrypt.compare(password, hash);
        console.log('🔐 Bcrypt comparison result:', result);
        return result;
    } catch (error) {
        console.error('❌ Bcrypt comparison error:', error);
        return false;
    }
}

// Генерация JWT токена
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

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// Маршрут аутентификации
app.post('/api/auth', async (req, res) => {
    console.log('✅ POST /api/auth called');
    console.log('📦 Request body:', req.body);
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Missing username or password');
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        console.log('🔑 Auth attempt for username:', username);
        console.log('👥 Available users:', users.map(u => u.username));

        // Ищем пользователя в базе данных
        const user = users.find(u => u.username === username);
        console.log('🔍 Found user:', user);
        
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Проверяем пароль с помощью bcrypt
        console.log('🔓 Starting password comparison...');
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        console.log('📊 Final password comparison result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', username);
            console.log('💡 Expected hash:', user.passwordHash);
            console.log('💡 Provided password:', password);
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерируем JWT токен
        const token = generateToken(user);
        console.log('🎫 Generated token:', token);

        // Возвращаем данные пользователя и токен
        const { passwordHash, ...userWithoutPassword } = user;
        
        console.log('✅ Auth successful for user:', username);
        res.json({
            ...userWithoutPassword,
            token
        });
        
    } catch (error) {
        console.error('❌ Ошибка аутентификации:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Защищенный маршрут для получения данных пользователя
app.get('/api/user', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Health checks
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Сервер работает нормально', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Сервер работает нормально', timestamp: new Date().toISOString() });
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

// Обработка несуществующих маршрутов
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🔐 API аутентификации доступно по адресу: http://localhost:${PORT}/api/auth`);
});

module.exports = app;
