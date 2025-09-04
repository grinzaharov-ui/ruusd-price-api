const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// Важно: Render использует process.env.PORT
const PORT = process.env.PORT || 10000;

console.log('=== SERVER START DIAGNOSTICS ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RENDER:', process.env.RENDER ? 'Yes' : 'No');
console.log('PORT from env:', process.env.PORT);
console.log('Using port:', PORT);
console.log('Current directory:', __dirname);
console.log('Files in directory:');
fs.readdirSync(__dirname).forEach(file => {
  console.log('  -', file);
});

// Middleware
app.use(cors({
    origin: '*', // Разрешаем все домены для диагностики
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Диагностический middleware - должен быть первым
app.use((req, res, next) => {
    console.log('\n🌐 INCOMING REQUEST');
    console.log('🌐 Time:', new Date().toISOString());
    console.log('🌐 Method:', req.method);
    console.log('🌐 URL:', req.url);
    console.log('🌐 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🌐 IP:', req.ip);
    console.log('🌐 Host:', req.get('host'));
    console.log('🌐 X-Forwarded-For:', req.get('x-forwarded-for'));
    console.log('🌐 X-Real-IP:', req.get('x-real-ip'));
    
    // Сохраняем оригинальные методы для логирования тела запроса
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(body) {
        console.log('🌐 Response:', body);
        return originalSend.call(this, body);
    };
    
    res.json = function(body) {
        console.log('🌐 JSON Response:', JSON.stringify(body, null, 2));
        return originalJson.call(this, body);
    };
    
    next();
});

// Защищенный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// База данных пользователей
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

// ТЕСТОВЫЕ ENDPOINTS ДЛЯ ДИАГНОСТИКИ
app.get('/api/auth/test', (req, res) => {
    console.log('✅ GET /api/auth/test called');
    res.json({ 
        message: 'GET test endpoint works!',
        timestamp: new Date().toISOString(),
        method: 'GET',
        success: true
    });
});

app.post('/api/auth/test', (req, res) => {
    console.log('✅ POST /api/auth/test called');
    console.log('Test body:', req.body);
    res.json({ 
        message: 'POST test endpoint works!',
        received: req.body,
        timestamp: new Date().toISOString(),
        method: 'POST',
        success: true
    });
});

app.get('/api/debug', (req, res) => {
    console.log('✅ GET /api/debug called');
    res.json({
        server: {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            isRender: !!process.env.RENDER,
            timestamp: new Date().toISOString()
        },
        endpoints: [
            'GET /api/auth/test',
            'POST /api/auth/test', 
            'POST /api/auth',
            'GET /api/health',
            'GET /health',
            'GET /api/debug'
        ]
    });
});

// Функция для проверки пароля
async function comparePassword(password, hash) {
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
    
    console.log('❌ Password does not match simple check, trying bcrypt...');
    try {
        const bcryptResult = await bcrypt.compare(password, hash);
        console.log('🔐 Bcrypt comparison result:', bcryptResult);
        return bcryptResult;
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
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
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

        // Проверяем пароль
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

        // Возвращаем данные пользователя и токен (исключая пароль)
        const { passwordHash, ...userWithoutPassword } = user;
        
        console.log('✅ Auth successful for user:', username);
        res.json({
            ...userWithoutPassword,
            token
        });
        
    } catch (error) {
        console.error('❌ Ошибка аутентификации:', error);
        console.error('❌ Error stack:', error.stack);
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

// Маршрут для проверки работы сервера
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Сервер работает нормально',
        timestamp: new Date().toISOString()
    });
});

// Health check для корневого URL
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Сервер работает нормально',
        timestamp: new Date().toISOString()
    });
});

// Обслуживание статических файлов (HTML, CSS, JS)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'wallet.html'));
});

// Обработка несуществующих маршрутов
app.use('*', (req, res) => {
    console.log('❌ Route not found:', req.method, req.url);
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('❌ Ошибка сервера:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

console.log('📋 Все роуты зарегистрированы:');
console.log('- GET /api/auth/test');
console.log('- POST /api/auth/test');
console.log('- GET /api/debug');
console.log('- POST /api/auth');
console.log('- GET /api/user');
console.log('- GET /api/health');
console.log('- GET /health');
console.log('- GET /');
console.log('- GET /wallet');

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🔐 API аутентификации доступно по адресу: http://localhost:${PORT}/api/auth`);
    console.log(`❤️ Health check доступен по адресу: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Основное приложение доступно по адресу: http://localhost:${PORT}/`);
    console.log(`🐞 Тестовые endpoints:`);
    console.log(`   - GET https://ruusd-price-api.onrender.com/api/auth/test`);
    console.log(`   - POST https://ruusd-price-api.onrender.com/api/auth/test`);
    console.log(`   - GET https://ruusd-price-api.onrender.com/api/debug`);
});

module.exports = app;