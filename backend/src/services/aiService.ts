import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' });

export class AIService {
  async generateSummary(text: string): Promise<string> {
    try {
      const prompt = `Você é um assistente jurídico especializado. Analise o seguinte documento jurídico e gere um resumo técnico profissional em português, destacando:
- Principais argumentos
- Fundamentação legal
- Pedidos
- Partes envolvidas

Documento:
${text.substring(0, 10000)}

Resumo técnico:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async chat(message: string, history: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Gemini uses a different history format, but for simplicity we'll just append the message for now
      // or map the history if we want a multi-turn chat.
      // For now, let's treat it as a single turn with context or try to reconstruct chat session.

      const chat = model.startChat({
        history: history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to process chat message');
    }
  }

  async generateThesis(caseData: any): Promise<string> {
    try {
      const prompt = `Com base nas seguintes informações do processo, gere uma tese jurídica central clara e fundamentada:

Título: ${caseData.title}
Assunto: ${caseData.subject}
Autor: ${caseData.plaintiff}
Réu: ${caseData.defendant}

Documentos: ${caseData.documents?.map((d: any) => d.summary).join('\n')}

Gere uma tese jurídica profissional:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating thesis:', error);
      throw new Error('Failed to generate thesis');
    }
  }

  async analyzeJurisprudence(query: string): Promise<any[]> {
    try {
      // Simulação de busca - em produção, integrar com APIs reais dos tribunais
      const mockResults = [
        {
          court: 'STJ',
          number: `REsp ${Math.floor(Math.random() * 9000000 + 1000000)}/SP`,
          date: new Date(),
          summary: 'Decisão sobre o tema pesquisado',
          understanding: 'Entendimento do tribunal sobre a matéria',
          link: 'https://stj.jus.br/exemplo',
          relevance: Math.floor(Math.random() * 20 + 80),
        },
      ];

      return mockResults;
    } catch (error) {
      console.error('Error analyzing jurisprudence:', error);
      throw new Error('Failed to analyze jurisprudence');
    }
  }
}

export default new AIService();