require('dotenv').config();

console.log('🚀 --- ENV DUMP START ---');
console.log('📂 CWD:', process.cwd());

const fs = require('fs');
if (fs.existsSync('.env')) {
    console.log('✅ .env file exists');
    const buf = fs.readFileSync('.env');
    console.log('📊 .env size:', buf.length);
    console.log('🔢 .env hex (first 20 bytes):', buf.toString('hex', 0, 20));
}

console.log('🌍 Environment Variables:');
Object.keys(process.env).forEach(key => {
    if (key.includes('URL') || key.includes('KEY') || key.includes('SECRET')) {
        console.log(`${key}: [DEFINED, length=${process.env[key].length}]`);
    } else {
        console.log(`${key}: ${process.env[key]}`);
    }
});
console.log('🏁 --- ENV DUMP END ---');
