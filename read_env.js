const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('📂 Checking:', envPath);

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('✅ File found! Size:', content.length);
    console.log('--- CONTENT START ---');
    console.log(content);
    console.log('--- CONTENT END ---');
} else {
    console.log('❌ File NOT found at:', envPath);
}
