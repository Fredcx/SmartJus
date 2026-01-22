import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';

interface DocumentAnalysis {
  documentType: string;
  summary: string;
  extractedData: {
    parties: {
      plaintiff?: string;
      defendant?: string;
    };
    caseNumber?: string;
    court?: string;
    judge?: string;
    caseType?: string;
    date?: string;
    subject?: string;
  };
  confidence: number;
  fullText: string;
}

export class DocumentAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no .env');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
  }

  async initModel() {
    if (this.model) return;

    try {
      // Tenta usar o modelo configurado ou um padrão
      const configuredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      console.log('🤖 Configurando modelo Gemini (inicial):', configuredModel);

      this.model = this.genAI.getGenerativeModel({
        model: configuredModel,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar modelo:', error);
    }
  }

  async extractText(input: string | Buffer, fileType?: string): Promise<string> {
    try {
      console.log('📄 Extraindo texto do documento...');

      let buffer: Buffer;
      if (Buffer.isBuffer(input)) {
        buffer = input;
      } else {
        buffer = fs.readFileSync(input);
      }

      const type = fileType || 'pdf';

      if (type === 'pdf' || type.includes('pdf')) {
        try {
          const data = await pdf(buffer, { max: 0, version: 'default' });
          if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF não contém texto extraível');
          }
          return data.text;
        } catch (pdfError: any) {
          console.error('❌ Erro ao processar PDF:', pdfError.message);
          throw new Error('Falha ao extrair texto do PDF');
        }
      }

      if (type === 'docx' || type.includes('officedocument') || type.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer });
        if (!result.value || result.value.trim().length === 0) {
          throw new Error('DOCX não contém texto extraível');
        }
        return result.value;
      }

      if (type === 'txt' || type.includes('text/plain') || type.includes('txt')) {
        const text = buffer.toString('utf-8');
        if (!text || text.trim().length === 0) throw new Error('Arquivo TXT está vazio');
        return text;
      }

      throw new Error('Tipo de arquivo não suportado. Use PDF, DOCX ou TXT.');

    } catch (error: any) {
      console.error('❌ Erro ao extrair texto:', error.message);
      throw error;
    }
  }

  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    await this.initModel();
    try {
      console.log('🤖 Analisando documento com Gemini...');
      console.log('📏 Tamanho do texto:', text.length, 'caracteres');

      const textSample = text.substring(0, 15000);

      const prompt = `Você é um assistente jurídico especializado em análise de documentos processuais brasileiros.
Analise o documento jurídico abaixo e extraia as seguintes informações:

**DOCUMENTO:**
${textSample}

**INSTRUÇÕES:**
Responda APENAS com um JSON válido no seguinte formato:
{
  "documentType": "peticao_inicial | contestacao | sentenca | acordao | despacho | recurso | outro",
  "summary": "Resumo objetivo em 2-3 frases do que se trata o documento",
  "extractedData": {
    "parties": {
      "plaintiff": "Nome completo do autor (se encontrado)",
      "defendant": "Nome completo do réu (se encontrado)"
    },
    "caseNumber": "0000000-00.0000.0.00.0000",
    "court": "Nome do tribunal",
    "judge": "Nome do juiz",
    "caseType": "Cível | Trabalhista | Criminal | ...",
    "date": "DD/MM/YYYY",
    "subject": "Assunto principal"
  },
  "confidence": 85
}
REGRAS: Use null se não encontrar. Responda APENAS JSON puro.`;

      console.log('🔄 Enviando para Gemini...');

      // LISTA DE MODELOS DE FALLBACK (AUTO-CORREÇÃO)
      const fallbackModels = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-latest'
      ];

      const currentModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      // Tenta o atual e depois os outros da lista
      const modelsToTry = [currentModel, ...fallbackModels.filter(m => m !== currentModel)];

      let analysis;
      let lastError;

      // Loop inteligente para trocar de modelo se der erro
      for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];

        if (i > 0) {
          console.log(`⚠️ Tentativa anterior falhou. Tentando modelo alternativo: ${modelName}`);
          this.model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
          });
        }

        try {
          console.log(`🔄 Tentando analisar com modelo: ${modelName}`);
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          let content = response.text();

          console.log('📥 Resposta recebida do Gemini');
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

          try {
            analysis = JSON.parse(content);
            console.log('✅ JSON válido recebido');
            break; // Sucesso!
          } catch (parseError) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
              break;
            }
          }
        } catch (apiError: any) {
          lastError = apiError;
          console.error(`❌ Erro com modelo ${modelName}:`, apiError.message);

          const isModelError = apiError.message.includes('404') ||
            apiError.message.includes('not found') ||
            apiError.message.includes('not supported') ||
            apiError.message.includes('400');

          if (isModelError) {
            console.log(`⚠️ Modelo ${modelName} indisponível. Tentando próximo...`);
            continue;
          }
          // Pequena pausa se não for erro de modelo
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!analysis) {
        throw lastError || new Error('Falha ao analisar documento após tentativas com múltiplos modelos');
      }

      return { ...analysis, fullText: text };

    } catch (error: any) {
      console.error('❌ Erro fatal:', error);
      return {
        documentType: 'outro',
        summary: 'Erro na análise automática (Verifique API Key/Modelos)',
        extractedData: { parties: {} },
        confidence: 0,
        fullText: text
      };
    }
  }

  generateCaseData(analysis: DocumentAnalysis, userId: string, documentUrl?: string) {
    const data = analysis.extractedData;
    let clientName = data.parties?.plaintiff || data.parties?.defendant || 'Cliente não identificado';
    let title = data.subject ? `Processo: ${data.subject}` : 'Processo Novo';

    return {
      title,
      caseNumber: data.caseNumber || null,
      clientName,
      opposingParty: null,
      court: data.court || null,
      judge: data.judge || null,
      caseType: data.caseType || 'Cível',
      status: 'active',
      description: analysis.summary,
      originalDocumentUrl: documentUrl || null,
      originalDocumentType: 'pdf',
      documentAnalysis: {
        type: analysis.documentType,
        confidence: analysis.confidence,
        extractedData: data,
        analyzedAt: new Date().toISOString()
      },
      autoCreated: true,
      userId,
    };
  }

  validateLegalDocument(text: string): boolean {
    const legalKeywords = ['processo', 'petição', 'excelentíssimo', 'juiz', 'tribunal', 'autor', 'réu', 'sentença'];
    const textLower = text.toLowerCase();
    return legalKeywords.filter(k => textLower.includes(k)).length >= 3;
  }
}

export default new DocumentAnalysisService();
