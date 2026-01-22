import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: './backend/.env' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada!');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('🔄 Listando modelos disponíveis...');

        // Note: listModels is an async generator or returns an object with listModels
        // In the current @google/generative-ai, we might need a different approach or just test common names
        // But let's try to find if there's a list function

        // Actually, @google/generative-ai doesn't have a simple listModels() in the client itself always, 
        // it's often done via the REST API or discovery.
        // Let's try testing 'gemini-1.5-flash-latest' and 'gemini-pro' directly.

        const modelsToTest = [
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-pro'
        ];

        for (const modelName of modelsToTest) {
            console.log(`\n🧪 Tentando: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Oi");
                const response = await result.response;
                console.log(`✅ SUCESSO com ${modelName}:`, response.text().substring(0, 20));
                break; // Achamos um!
            } catch (e: any) {
                console.error(`❌ Falha com ${modelName}:`, e.message);
            }
        }

    } catch (error: any) {
        console.error('❌ Erro geral:', error.message);
    }
}

listModels();
