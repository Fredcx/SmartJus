import dotenv from 'dotenv';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: './backend/.env' });

async function discoverModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada!');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('🔄 Listando modelos via API...');

        // The correct way in recent SDK versions is to use the fetch/REST or find the method
        // But genAI.getGenerativeModel({ model: '...' }) is standard.
        // Let's try to hit the list endpoint via fetch to be sure
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Modelos encontrados:');
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        } else {
            console.log('❌ Nenhum modelo retornado. Resposta do servidor:', JSON.stringify(data, null, 2));
        }

    } catch (error: any) {
        console.error('❌ Erro na descoberta:', error.message);
    }
}

discoverModels();
