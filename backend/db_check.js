const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔄 Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connection successful!');

        const count = await prisma.user.count();
        console.log(`📊 Current user count: ${count}`);

        const users = await prisma.user.findMany({ select: { email: true } });
        console.log('👥 Users in DB:', users.map(u => u.email));

    } catch (e) {
        console.error('❌ Database Error:', e.message);
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
