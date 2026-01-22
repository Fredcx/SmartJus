const { Client } = require('pg');
const connectionString = 'postgresql://postgres.llshyrwxgcwfxtfmbskj:LegalSystem2024!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

const client = new Client({
    connectionString: connectionString,
});

console.log('🚀 Iniciando teste de conexão com o banco de dados...');
console.log('📡 Host:', 'aws-0-sa-east-1.pooler.supabase.com');

client.connect()
    .then(() => {
        console.log('✅ Conectado ao banco de dados com sucesso!');
        return client.query('SELECT NOW()');
    })
    .then(res => {
        console.log('📊 Resultado da query (SELECT NOW()):', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro de conexão:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        process.exit(1);
    });
