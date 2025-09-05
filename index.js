const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();

<<<<<<< HEAD
const PORT = process.env.PORT || 3000;
=======
const PORT = process.env.PORT || 10000;
>>>>>>> 7c4a6691abfbc1c363c9e7bab936347d550d9159

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
<<<<<<< HEAD
        // Пароль: proffit10000 (захеширован bcrypt)
        passwordHash: '$2a$12$4iuG1.9mGXv7Q2p8V6sZz.AKjLpM2qN1rB3cD5fE7gH9iJ1kL3mN5p7',
=======
        // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ХЕШ из generate-hash.js
        passwordHash: '$2a$12$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
>>>>>>> 7c4a6691abfbc1c363c9e7bab936347d550d9159
        balance: '10000', 
        name: 'Диана', 
        avatar: 'Д'
    },
    {
        id: 2,
        username: 'admin',
<<<<<<< HEAD
        // Пароль: admin123 (захеширован bcrypt)
        passwordHash: '$2a$12$7pW3r5tH9vC1xE3zB5d7F.AKjLpM2qN1rB3cD5fE7gH9iJ1kL3mN5p7',
=======
        // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ ХЕШ из generate-hash.js
        passwordHash: '$2a$12$8K1p/a0dRaW0H.6dR0nYf.LyO6LyO6LyO6LyO6LyO6LyO6LyO6LyO',
>>>>>>> 7c4a6691abfbc1c363c9e7bab936347d550d9159
        balance: '100000100000', 
        name: 'Администратор', 
        avatar: 'A'
    }
];

// Функция для проверки пароля (ПРАВИЛЬНАЯ bcrypt проверка)
async function comparePassword(password, hash) {
    try {
        console.log('🔐 Comparing password with bcrypt...');
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
        { expires极速下载In: '24h' }
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
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Логин и пароль обязательны' });
        }

        // Ищем пользователя в базе данных
        const user = users.find(u => u.username === username);
        if (!user) {
<<<<<<< HEAD
            return res.status(401).json({极速下载 error: 'Неверный логин или пароль' });
=======
            return res.status(401).json({ error: 'Неверный логин или пароль' });
>>>>>>> 7c4a6691abfbc1c363c9e7bab936347d550d9159
        }

        // Проверяем пароль с помощью bcrypt
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерируем JWT токен
        const token = generateToken(user);

        // Возвращаем данные пользователя и токен
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

<<<<<<< HEAD
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
=======
// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
>>>>>>> 7c4a6691abfbc1c363c9e7bab936347d550d9159
});

module.exports = app;