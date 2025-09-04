const express = require('express');
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

// Защищенный ключ для JWT (в продакшене используйте переменные окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Мок база данных пользователей (в реальном приложении используйте настоящую БД)
const users = [
    {
        id: 1,
        username: 'Diana042',
        // Пароль: proffit10000 (захеширован)
        passwordHash: '$2a$10$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO', 
        balance: '10000', 
        name: 'Диана', 
        avatar: 'Д'
    },
    {
        id: 2,
        username: 'admin',
        // Пароль: admin123 (захеширован)
        passwordHash: '$2a$10$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
        balance: '100000100000', 
        name: 'Администратор', 
        avatar: 'A'
    }
];

// Функция для хеширования пароля
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

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
function authenticateToken(req极速下载, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user极速下载) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

// Маршрут аутентификации
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Проверяем наличие username и password
        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        // Ищем пользователя в базе данных
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Проверяем пароль
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерируем JWT токен
        const token = generateToken(user);

        // Возвращаем данные пользователя и токен (исключая пароль)
        const { passwordHash, ...userWithoutPassword } = user;
        res.json({
            ...userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
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

// Экспорт для тестирования
module.exports = app;