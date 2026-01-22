const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function test() {
    console.log('🚀 --- DEBUG PRISMA v3 START ---');

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
        console.log('🔗 DATABASE_URL found in process.env!');
        console.log('🔗 Masked URL:', masked);
    } else {
        console.log('❌ DATABASE_URL is UNDEFINED in process.env');
        console.log('📂 Current directory:', process.cwd());
        const fs = require('fs');
        if (fs.existsSync('.env')) {
            console.log('✅ .env file EXISTS in current directory');
            const content = fs.readFileSync('.env', 'utf8');
            console.log('📄 .env size:', content.length, 'bytes');
        } else {
            console.log('❌ .env file NOT FOUND in current directory');
        }
    }

    const prisma = new PrismaClient();

    try {
        console.log('⏳ Attempting $connect()...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const count = await prisma.user.count();
        console.log('👥 User count:', count);
    } catch (e) {
        console.error('❌ Error during $connect():');
        console.error('Message:', e.message);
    } finally {
        await prisma.$disconnect();
        console.log('🏁 --- DEBUG PRISMA v3 END ---');
    }
}

test();
