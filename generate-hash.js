const bcrypt = require('bcryptjs');

async function generateHashes() {
    try {
        const password1 = 'proffit10000';
        const password2 = 'admin123';
        
        const hash1 = await bcrypt.hash(password1, 10);
        const hash2 = await bcrypt.hash(password2, 10);
        
        console.log('================================');
        console.log('Хеш для proffit10000:');
        console.log(hash1);
        console.log('');
        console.log('Хеш для admin123:');
        console.log(hash2);
        console.log('================================');
        
        return { hash1, hash2 };
    } catch (error) {
        console.error('Ошибка генерации хешей:', error);
    }
}

generateHashes();