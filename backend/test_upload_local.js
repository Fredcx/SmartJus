const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    const form = new FormData();
    form.append('documents', Buffer.from('Conteudo de teste'), {
        filename: 'teste.txt',
        contentType: 'text/plain',
    });

    try {
        console.log('🚀 Enviando requisicao para http://localhost:3002/api/v1/save-case-data...');
        const response = await axios.post('http://localhost:3002/api/v1/save-case-data', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer MOCK_TOKEN' // Ignorado se removermos o middleware
            }
        });
        console.log('✅ Resposta:', response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Erro:', error.response.status, error.response.data);
        } else {
            console.error('❌ Erro:', error.message);
        }
    }
}

testUpload();
