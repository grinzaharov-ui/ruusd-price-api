const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Разрешаем запросы откуда угодно
app.use(cors());
app.use(express.json());

// Настройки нашего токена RuUSD
const TOKEN_CONFIG = {
  name: "Russian USD",
  symbol: "RuUSD", 
  fixedPriceUSD: 1.00
};

// 📌 Главный endpoint для получения цены
app.get('/api/price', (req, res) => {
  const response = {
    "ruusd": {
      "usd": 1.00,
      "last_updated_at": Math.floor(Date.now() / 1000)
    }
  };
  console.log('✅ Кто-то запросил цену RuUSD');
  res.json(response);
});

// 📌 Информация о нашем токене
app.get('/api/token-info', (req, res) => {
  res.json({
    "name": "Russian USD",
    "symbol": "RuUSD",
    "price": "1.00 USD",
    "contract_address": "0x0B4CCd0b877Df039e295Fd52533c14EF151D223d",
    "chain": "Polygon Mainnet"
  });
});

// 📌 Проверка что сервер работает
app.get('/health', (req, res) => {
  res.json({ 
    "status": "OK", 
    "message": "RuUSD API работает отлично!",
    "timestamp": new Date().toISOString()
  });
});

// 📌 Главная страница
app.get('/', (req, res) => {
  res.send(`
    <h1>💰 RuUSD Price API</h1>
    <p>Добро пожаловать! Этот API предоставляет цену токена RuUSD.</p>
    <p><strong>Текущая цена: 1 RuUSD = 1.00 USD</strong></p>
    <h3>Доступные endpoints:</h3>
    <ul>
      <li><a href="/api/price">/api/price</a> - Получить цену</li>
      <li><a href="/api/token-info">/api/token-info</a> - Информация о токене</li>
      <li><a href="/health">/health</a> - Проверка здоровья сервера</li>
    </ul>
  `);
});

// 📌 Кастомный RPC endpoint для кошельков
app.get('/api/rpc-price', (req, res) => {
  try {
    const response = {
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "ruusd": {
          "usd": 1.00,
          "price": "1000000000000000000", // 1.00 в wei (18 decimals)
          "timestamp": Math.floor(Date.now() / 1000),
          "source": "official_oracle",
          "contract_address": "0x0B4CCd0b877Df039e295Fd52533c14EF151D223d",
          "network": "Polygon Mainnet"
        }
      }
    };
    console.log('✅ RPC price request served');
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ RPC endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📌 Endpoint для метаданных токена
app.get('/api/token-metadata', (req, res) => {
  res.json({
    "name": "Russian USD",
    "symbol": "RUUSD",
    "decimals": 18,
    "address": "0x0B4CCd0b877Df039e295Fd52533c14EF151D223d",
    "official_price": 1.00,
    "price_source": "https://ruusd-price-api.onrender.com/api/rpc-price",
    "network": "Polygon Mainnet",
    "website": "https://your-project.com", // Замените на ваш сайт
    "description": "Stablecoin pegged to 1 USD"
  });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log('🎉 RuUSD Price API запущен!');
  console.log('📍 Сервер работает на порту: ' + PORT);
  console.log('🌐 Откройте в браузере:');
  console.log('   → http://localhost:' + PORT);
  console.log('   → http://localhost:' + PORT + '/api/price');
  console.log('   → http://localhost:' + PORT + '/health');
});