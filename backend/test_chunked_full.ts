import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

async function testFullChunkedFlow() {
    const filePath = 'backend/test_upload.txt'; // Valid text file
    const fileBuffer = await fs.readFile(filePath);
    const CHUNK_SIZE = 1024; // Small chunks for testing
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
    const uploadId = 'test-upload-' + Date.now();

    console.log(`🚀 Iniciando teste de upload em pedaços (${totalChunks} chunks)...`);

    let lastResponse;
    const token = 'MOCK_TOKEN'; // We need a real token if auth is enabled and strict

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileBuffer.length);
        const chunk = fileBuffer.slice(start, end).toString('base64');

        process.stdout.write(`📤 Enviando chunk ${i + 1}/${totalChunks}... `);

        try {
            lastResponse = await axios.post('http://localhost:3002/api/v1/data-record/chunk', {
                uploadId,
                chunkIndex: i,
                totalChunks,
                chunk,
                fileName: 'test.txt',
                fileType: 'text/plain'
            }, {
                // Mocking auth if necessary or using a dev bypass
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅');
        } catch (error: any) {
            console.error('\n❌ Erro:', error.response?.data || error.message);
            return;
        }
    }

    console.log('\n🏁 Teste concluído!');
    console.log('📦 Resposta final:', JSON.stringify(lastResponse?.data, null, 2));
}

testFullChunkedFlow();
