node generate-hash.jsconst express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();

// Важно: Render использует process.env.PORT
const PORT = process.env.PORT || 3000;

console.log('Environment PORT:', process.env.PORT);
console.log('Using port:', PORT);

// Middleware
app.use(cors({
    origin: 'https://ruusd-price-api.onrender.com',
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Защищенный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// База данных пользователей с правильными хешами
const users = [
    {
        id: 1,
        username: 'Diana042',
        // Пароль: proffit10000 (захеширован)
        passwordHash: '$2a$10$V6uW5Jk8Lk7H2q9w1zTgE.1xX3yZ5A7B9C1D3E5G7H9J1K3L5N7P9R1T3V5', // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ХЕШ
        balance: '10000', 
        name: 'Диана', 
        avatar: 'Д'
    },
    {
        id: 2,
        username: 'admin',
        // Пароль: admin123 (захеширован)
        passwordHash: '$2a$10$X7vW6Kk9Ml8I3r2x4UhF.2yY4z6B8C0D2E4F6H8J0K2L4N6P8R0T2V4', // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ХЕШ
        balance: '100000100000', 
        name: 'Администратор', 
        avatar: 'A'
    }
];

// Функция для проверки пароля
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
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
    console.log('Request body:', req.body);
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ Missing username or password');
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        console.log('Auth attempt for username:', username);

        // Ищем пользователя в базе данных
        const user = users.find(u => u.username === username);
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Проверяем пароль
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        console.log('Password comparison result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', username);
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерируем JWT токен
        const token = generateToken(user);

        // Возвращаем данные пользователя и токен (исключая пароль)
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
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

console.log('Все роуты зарегистрированы:');
console.log('- POST /api/auth');
console.log('- GET /api/user');
console.log('- GET /api/health');
console.log('- GET /health');
console.log('- GET /');
console.log('- GET /wallet');

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API аутентификации доступно по адресу: http://localhost:${PORT}/api/auth`);
    console.log(`Health check доступен по адресу: http://localhost:${PORT}/api/health`);
    console.log(`Основное приложение доступно по адресу: http://localhost:${PORT}/`);
});

module.exports = app;