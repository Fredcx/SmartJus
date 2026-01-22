import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: './backend/.env' });

async function testGemini2() {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = 'gemini-2.0-flash';

    console.log(`🤖 Testando API Key: ${apiKey?.substring(0, 10)}...`);
    console.log(`🤖 Modelo: ${modelName}`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada!');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Diga 'Olá, sistema jurídico' se você estiver funcionando corretamente.";
        console.log('🔄 Enviando prompt...');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log('✅ RESPOSTA DA IA:', response.text());
    } catch (error: any) {
        console.error('❌ Erro no Gemini:', error.message);
    }
}

testGemini2();
