const { PrismaClient } = require('@prisma/client');

async function testConnection(url, label) {
    console.log(`\n📡 Testing: ${label}`);
    const prisma = new PrismaClient({
        datasources: {
            db: { url }
        }
    });

    try {
        await prisma.$connect();
        console.log(`✅ SUCCESS: ${label}`);
        const result = await prisma.$queryRaw`SELECT NOW()`;
        console.log(`📊 Time from DB: ${JSON.stringify(result)}`);
        return true;
    } catch (e) {
        console.log(`❌ FAILED: ${label}`);
        console.log(`   Error: ${e.message.split('\n')[0]}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    const project = 'llshyrwxgcwfxtfmbskj';
    const pass = 'LegalSystem2024%21';
    const host = `db.${project}.supabase.co`;

    const tests = [
        {
            label: 'Direct Pooler (6543) + ProjectUser',
            url: `postgresql://postgres.${project}:${pass}@${host}:6543/postgres?sslmode=require&pgbouncer=true`
        },
        {
            label: 'Direct Pooler (6543) + PlainUser',
            url: `postgresql://postgres:${pass}@${host}:6543/postgres?sslmode=require&pgbouncer=true`
        },
        {
            label: 'Shared Pooler (6543) + ProjectUser',
            url: `postgresql://postgres.${project}:${pass}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
        }
    ];

    for (const t of tests) {
        const success = await testConnection(t.url, t.label);
        if (success) {
            console.log('\n✨ FOUND WORKING CONNECTION STRING!');
            console.log(`Final DATABASE_URL: "${t.url}"`);
            process.exit(0);
        }
    }

    process.exit(1);
}

main();
