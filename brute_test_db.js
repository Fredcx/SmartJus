const { Client } = require('pg');

const configs = [
    {
        name: 'Shared Pooler + ProjectUser + EncodedPass',
        url: 'postgresql://postgres.llshyrwxgcwfxtfmbskj:LegalSystem2024%21@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Shared Pooler + ProjectUser + RAWPass',
        url: 'postgresql://postgres.llshyrwxgcwfxtfmbskj:LegalSystem2024!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Direct Pooler + PlainUser + EncodedPass',
        url: 'postgresql://postgres:LegalSystem2024%21@db.llshyrwxgcwfxtfmbskj.supabase.co:6543/postgres?sslmode=require'
    },
    {
        name: 'Direct Pooler + PlainUser + RAWPass',
        url: 'postgresql://postgres:LegalSystem2024!@db.llshyrwxgcwfxtfmbskj.supabase.co:6543/postgres?sslmode=require'
    },
    {
        name: 'Direct Pooler + ProjectUser + EncodedPass',
        url: 'postgresql://postgres.llshyrwxgcwfxtfmbskj:LegalSystem2024%21@db.llshyrwxgcwfxtfmbskj.supabase.co:6543/postgres?sslmode=require'
    }
];

async function run() {
    for (const config of configs) {
        console.log(`📡 testing: ${config.name}...`);
        const client = new Client({ connectionString: config.url });
        try {
            await client.connect();
            console.log(`✅ SUCCESS: ${config.name}`);
            await client.end();
            process.exit(0);
        } catch (e) {
            console.log(`❌ FAILED: ${config.name} - ${e.message}`);
        }
    }
    console.log('🏁 All attempts failed.');
    process.exit(1);
}

run();
