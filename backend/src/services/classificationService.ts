
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ClassificationResult {
    type: string;
    confidence: number;
}

export class ClassificationService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not found');
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    }

    async classifyDocument(text: string): Promise<ClassificationResult> {
        try {
            const allowedTypes = [
                'peticao_inicial', 'contestacao', 'replica',
                'laudo_medico', 'boletim_ocorrencia', 'sentenca', 'outro'
            ];

            const prompt = `Classifique o seguinte documento jurídico em um dos tipos abaixo:
${allowedTypes.join(', ')}

Documento (trecho inicial/final):
${text.substring(0, 5000)}...${text.substring(text.length - 2000)}

Responda APENAS com um JSON neste formato:
{
  "type": "tipo_escolhido",
  "confidence": 0-100
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text();

            textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const json = JSON.parse(textResponse);

            // Validação básica
            if (!allowedTypes.includes(json.type)) {
                return { type: 'outro', confidence: json.confidence || 0 };
            }

            return json;
        } catch (error) {
            console.error('Error classifying document:', error);
            return { type: 'outro', confidence: 0 };
        }
    }
}

export default new ClassificationService();
