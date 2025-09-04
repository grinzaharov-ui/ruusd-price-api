const bcrypt = require('bcryptjs');

async function generateHashes() {
    try {
        console.log('🔐 Generating password hashes...');
        
        const password1 = 'proffit10000';
        const password2 = 'admin123';
        
        const hash1 = await bcrypt.hash(password1, 12);
        const hash2 = await bcrypt.hash(password2, 12);
        
        console.log('\n✅ Generated hashes:');
        console.log('====================');
        console.log('Password: proffit10000');
        console.log('Hash:    ', hash1);
        console.log('\nPassword: admin123');
        console.log('Hash:    ', hash2);
        console.log('====================');
        
        return { hash1, hash2 };
    } catch (error) {
        console.error('❌ Error generating hashes:', error);
    }
}

generateHashes();