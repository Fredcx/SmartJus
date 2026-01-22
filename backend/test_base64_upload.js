const axios = require('axios');
const fs = require('fs');

async function testBase64Upload() {
    const filePath = 'backend/test_upload_local.js'; // Just a small file to test
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');

    const payload = {
        files: [
            {
                name: 'test.js',
                mimetype: 'application/javascript',
                base64: base64
            }
        ]
    };

    try {
        console.log('🚀 Enviando requisicao Base64 para http://localhost:3002/api/v1/data-record...');
        const response = await axios.post('http://localhost:3002/api/v1/data-record', payload);
        console.log('✅ Resposta:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Erro:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Erro:', error.message);
        }
    }
}

testBase64Upload();
