
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DOCUMENT_TEMPLATES } from '../utils/documentTemplates';

export class IndividualSummaryService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not found');
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    }

    async summarizeDocument(text: string, type: string): Promise<any> {
        try {
            // @ts-ignore
            const template = DOCUMENT_TEMPLATES[type];

            if (!template) {
                console.warn(`No template found for type: ${type}. Using generic summary.`);
                return this.generateGenericSummary(text);
            }

            const prompt = `Analise o documento do tipo "${template.name}" e extraia as informações seguindo ESTRITAMENTE o formato JSON abaixo.
Não invente informações. Se não encontrar, use null ou string vazia.

Estrutura JSON desejada:
${template.structure}

Documento:
${text.substring(0, 15000)}

Responda APENAS com o JSON válido.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text();

            textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            try {
                return JSON.parse(textResponse);
            } catch (e) {
                // Fallback: try to extract json substring
                const match = textResponse.match(/\{[\s\S]*\}/);
                if (match) return JSON.parse(match[0]);
                throw e;
            }

        } catch (error) {
            console.error('Error summarizing document:', error);
            return { error: 'Failed to generate summary', details: String(error) };
        }
    }

    private async generateGenericSummary(text: string): Promise<any> {
        const prompt = `Resuma o seguinte documento jurídico destacando os pontos principais:
    ${text.substring(0, 10000)}
    
    Responda com JSON: { "resumo": "..." }`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(textResponse);
        } catch (e) {
            return { summary: 'Resumo indisponível' };
        }
    }
}

export default new IndividualSummaryService();
