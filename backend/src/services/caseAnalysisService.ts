import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database';
import { GLOBAL_CASE_SUMMARY_TEMPLATE } from '../utils/documentTemplates';
import { supabase } from '../config/supabase';

export class CaseAnalysisService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not found');
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    private getModel(modelName: string) {
        return this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        });
    }

    async generateGlobalSummary(caseId: string): Promise<any> {
        try {
            console.log(`📊 Gerando resumo para caso ${caseId}...`);

            const caseData = await prisma.case.findUnique({
                where: { id: caseId },
                include: { documents: { select: { type: true, individualSummary: true, classification: true, id: true, name: true, createdAt: true, summary: true, extractedTextPath: true } } }
            });

            if (!caseData) throw new Error('Case not found');

            const caseContext = `
INFORMAÇÕES:
- Título: ${caseData.title}
- Número: ${caseData.caseNumber || 'N/A'}
- Cliente: ${caseData.clientName}
- Juiz: ${caseData.judge || 'N/A'}
- Descrição: ${caseData.description || 'N/A'}
- Tese: ${caseData.thesis || 'N/A'}
`;

            const docsContext = await Promise.all(caseData.documents.map(async (doc: any, idx: number) => {
                let docContent = "N/A";
                if (doc.extractedTextPath) {
                    try {
                        const { data, error } = await supabase.storage
                            .from('documents')
                            .download(doc.extractedTextPath);

                        if (data && !error) {
                            docContent = (await data.text()).substring(0, 5000);
                        }
                    } catch (e) {
                        console.error(`Error fetching text from Supabase for doc ${doc.id}:`, e);
                    }
                } else if (doc.individualSummary) {
                    docContent = JSON.stringify(doc.individualSummary);
                } else if (doc.summary) {
                    docContent = doc.summary;
                }
                return `DOC ${idx + 1} (${doc.type}): ${docContent}`;
            })).then(r => r.join('\n'));

            const prompt = `Analise este processo jurídico e gere um JSON estrito.
${caseContext}
DOCUMENTOS:
${docsContext}

OBJETIVO: Gerar JSON conforme modelo abaixo.
SEÇÕES OBRIGATÓRIAS:
1. Identificação Automática da Peça
2. Dados Processuais Extraídos
3. Visão Geral do Caso
4. Histórico Processual
5. Objeto da Peça Atual
6. Tese Jurídica Principal
7. Fundamentos Jurídicos Citados
8. Situação Pessoal / Urgência
9. Pedido Final
10. Conclusão Resumida

FORMATO JSON:
${GLOBAL_CASE_SUMMARY_TEMPLATE}

Responda APENAS JSON.`;

            // === NOVA LISTA DE FALLBACK ULTRA COMPLETA ===
            const fallbackModels = [
                'gemini-1.5-flash',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro',
                'gemini-pro'
            ];

            const currentModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
            const modelsToTry = [currentModel, ...fallbackModels.filter(m => m !== currentModel)];

            let summaryJson;
            let lastError;

            console.log("🤖 Iniciando tentativa de modelos com Inteligência Artificial...");

            for (let i = 0; i < modelsToTry.length; i++) {
                const modelName = modelsToTry[i];
                if (i > 0) console.log(`⏩ Falhou. Tentando próximo modelo: ${modelName}`);

                try {
                    this.model = this.getModel(modelName);
                    const result = await this.model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                    try {
                        summaryJson = JSON.parse(text);
                        console.log(`✅ SUCESSO com modelo: ${modelName}`);
                        break;
                    } catch (e) {
                        const match = text.match(/\{[\s\S]*\}/);
                        if (match) {
                            summaryJson = JSON.parse(match[0]);
                            console.log(`✅ SUCESSO (via regex) com modelo: ${modelName}`);
                            break;
                        }
                    }
                } catch (error: any) {
                    lastError = error;
                    const msg = error.message.toLowerCase();
                    if (msg.includes('404') || msg.includes('not found') || msg.includes('not supported')) {
                        // Se for erro de "Não encontrado", continua pro próximo
                        continue;
                    }
                    console.error(`❌ Erro técnico em ${modelName}:`, error.message);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!summaryJson) {
                // SE TUDO FALHAR, LISTA O QUE TEM DISPONÍVEL NO LOG
                console.log("📋 =================================================");
                console.log("❌ TODOS OS MODELOS FALHARAM. VERIFICANDO SUA CONTA...");
                try {
                    // @ts-ignore
                    const available = await this.genAI.listModels();
                    // @ts-ignore
                    console.log("📋 MODELOS HABILITADOS NA SUA SENHA:", available.map(m => m.name));
                } catch (e) {
                    console.log("❌ Não consegui listar os modelos. Verifique sua API Key.");
                }
                console.log("📋 =================================================");

                throw lastError || new Error('Nenhum modelo funcionou.');
            }

            await prisma.case.update({
                where: { id: caseId },
                data: { caseSummary: summaryJson, status: 'active', thesis: caseData.thesis || summaryJson.tese_sugerida || caseData.thesis }
            });

            return summaryJson;
        } catch (error) {
            console.error('❌ Error no CaseAnalysisService:', error);
            throw error;
        }
    }
}

export default new CaseAnalysisService();
