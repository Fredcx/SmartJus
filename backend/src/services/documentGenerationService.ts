import { GoogleGenerativeAI } from '@google/generative-ai';

interface CaseData {
  title: string;
  caseNumber: string | null;
  clientName: string;
  opposingParty: string | null;
  court: string | null;
  judge: string | null;
  caseType: string;
  description: string | null;
  jurisprudences?: any[];
  jurisprudence?: any[]; // Prisma field name
  deadlines: any[];
  thesis?: string | null;
}

interface UserData {
  name: string;
  lawFirmName: string | null;
  oab: string | null;
  oabState: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
}

export class DocumentGenerationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no .env');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  private async getModelWithFallback(prompt: string): Promise<string> {
    const models = [
      process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let lastError;
    // Remove duplicates
    const uniqueModels = [...new Set(models)];

    for (const modelName of uniqueModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.error(`⚠️ Erro com modelo ${modelName}:`, error.message);
        if (error.message.includes('404') || error.message.includes('not found')) {
          continue;
        }
        break; // Stop if it's a non-404 error (e.g. 401, 429)
      }
    }
    throw lastError || new Error('Nenhum modelo Gemini funcionou.');
  }

  // ============================================
  // MÉTODO AUXILIAR PARA GERAR TEXTO
  // ============================================
  private async generateText(prompt: string): Promise<string> {
    try {
      return await this.getModelWithFallback(prompt);
    } catch (error: any) {
      console.error('❌ Erro ao chamar Gemini:', error);
      // ... existing error logic ...

      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        throw new Error('Cota da IA excedida (Erro 429). Aguarde alguns instantes ou verifique seu plano do Gemini.');
      }

      throw new Error('Falha ao gerar texto com IA. Tente novamente.');
    }
  }


  // ============================================
  // HELPERS
  // ============================================
  private formatEvidence(evidenceDocuments?: any[]): string {
    if (!evidenceDocuments || evidenceDocuments.length === 0) return 'Nenhuma prova documental selecionada.';

    return evidenceDocuments.map((doc, i) => `
[Doc. ${i + 1}] Nome: ${doc.name}
Tipo: ${(doc.classification as any)?.type || 'Documento'}
Resumo/Conteúdo: ${(doc.individualSummary as any)?.content || (doc.individualSummary as any)?.summary || 'Sem análise detalhada disponível.'}
`).join('\n');
  }

  // ============================================
  // GERAR RESUMO DO PROCESSO
  // ============================================
  async generateSummary(caseData: CaseData): Promise<string> {
    console.log('📝 Gerando resumo do processo com Gemini...');

    const prompt = `ATUE COMO UM ESTRATEGISTA JURÍDICO SÊNIOR. Sua tarefa é analisar este caso e produzir um relatório de inteligência processual.

**DADOS DO PROCESSO:**
- Título: ${caseData.title}
- Número: ${caseData.caseNumber || 'PENDENTE'}
- Tipo da Ação: ${caseData.caseType}
- Cliente (Nossa Parte): ${caseData.clientName}
- Parte Adversa: ${caseData.opposingParty || 'Não qualificada'}
- Juízo: ${caseData.court || 'Não distribuído'}

**DESCRIÇÃO DOS FATOS E CONTEXTO:**
"${caseData.description || 'Descrição não fornecida. Baseie-se apenas nos dados estruturados.'}"

**DADOS ESTRUTURAIS:**
- Prazos: ${caseData.deadlines.length > 0 ? caseData.deadlines.map((d: any) => `${d.title} (${new Date(d.dueDate).toLocaleDateString('pt-BR')})`).join(', ') : 'Sem prazos ativos'}
- Jurisprudência Anexada: ${(caseData.jurisprudence || caseData.jurisprudences || []).length} julgados.

------------------------------------------------------------------
COMO NARRAR O RESUMO:
1. **Seja Analítico, não apenas descritivo.** Não apenas repita os dados, explique o que eles significam para a estratégia.
2. **Identifique Lacunas.** Se faltar informação crítica (ex: valor da causa, data do fato), aponte isso explicitamente.
3. **Linguagem:** Objetiva, técnica, direta. Use português jurídico culto.

GERE O RESUMO SEGUINDO ESTRITAMENTE ESTA ESTRUTURA MARKDOWN:

# 📋 RESUMO ESTRATÉGICO DO PROCESSO

## 1. SÍNTESE FÁTICA E PROCESSUAL
(Um parágrafo denso explicando: Quem está processando quem? Por quê? Qual o objeto central da disputa?)

## 2. PONTOS NEVRÁLGICOS
(Liste em bullets os 3-5 pontos mais críticos ou polêmicos do caso baseados na descrição)

## 3. ANÁLISE DAS PARTES
- **Cliente:** [Posição processual e vulnerabilidades]
- **Adverso:** [Posição processual e prováveis alegações]

## 4. STATUS E PROXIMIDADE DE PRAZOS
(Analise se há urgência baseada nos prazos listados. Se não houver, indique "Fluxo ordinário".)

## 5. DADOS FALTANTES (Crítico)
(Liste o que precisamos descobrir imediatamente para não prejudicar a defesa/ataque. Ex: Endereços, CNPJ, Datas exatas.)

## 6. RECOMENDAÇÃO IMEDIATA
(Qual a única ação que o advogado deve tomar AGORA?)`;

    try {
      const content = await this.generateText(prompt);
      console.log('✅ Resumo gerado com sucesso');
      return content;
    } catch (error) {
      console.error('❌ Erro ao gerar resumo:', error);
      throw error;
    }
  }

  // ============================================
  // GERAR PETIÇÃO INICIAL
  // ============================================
  async generatePeticao(caseData: CaseData, userData: UserData, evidenceDocuments?: any[]): Promise<string> {
    console.log('📄 Gerando petição inicial com Gemini...');

    const jurisprudenciasTexto = (caseData.jurisprudence || caseData.jurisprudences || []).length > 0
      ? (caseData.jurisprudence || caseData.jurisprudences || []).map((j: any, i: number) => `
**Jurisprudência ${i + 1}:**
Tribunal: ${j.court}
Número: ${j.number}
Data: ${j.date}
Ementa: ${j.ementa ? j.ementa.substring(0, 500) : j.summary}
`).join('\n')
      : 'Nenhuma jurisprudência anexada';

    const provasTexto = this.formatEvidence(evidenceDocuments);

    const prompt = `ATUE COMO UM SÓCIO SÊNIOR DE UM GRANDE ESCRITÓRIO DE ADVOCACIA (BIG LAW).
Sua reputação é de escrever peças impecáveis, persuasivas e praticamente prontas para o protocolo.

**MISSÃO:** Redigir uma **PETIÇÃO INICIAL** completa, técnica e agressiva na defesa dos interesses do cliente.

---
### 1. ARQUIVO DO CASO (DADOS BRUTOS)
- **JUÍZO COMPETENTE:** ${caseData.court || '[IDENTIFICAR VARA CÍVEL COMPETENTEDA COMARCA DE X]'}
- **AUTOR:** ${caseData.clientName}
- **RÉU:** ${caseData.opposingParty || '[QUALIFICAÇÃO DO RÉU PENDENTE]'}
- **TIPO DE AÇÃO:** ${caseData.caseType}
- **FATOS NARRADOS:** "${caseData.description || 'Necessário construir narrativa baseada na natureza da ação.'}"

### 2. ARSENAL PROBATÓRIO (Documentos)
${provasTexto}

### 3. JURISPRUDÊNCIA VINCULANTE (Nossa Tese)
${jurisprudenciasTexto}

### 4. DADOS DO SIGNATÁRIO
- Advogado: ${userData.name}
- OAB: ${userData.oab}/${userData.oabState}

---
### REGRAS DE OURO DA REDAÇÃO (NÃO IGNORE)
1. **Linguagem:** Use o padrão culto formal, mas evite latinismos excessivos (use apenas os essenciais como *fumus boni iuris* se couber). Seja assertivo.
2. **Missing Info:** NUNCA invente dados como CPF, CNPJ ou endereços. Use EXATAMENTE este formato para dados faltantes: **[INSERIR ENDEREÇO COMPLETO]**, **[INSERIR CPF]**.
3. **Citação de Provas:** É OBRIGATÓRIO citar os documentos anexos para provar o alegado. Ex: "Como prova o boletim de ocorrência anexo **(Doc. 01)**...".
4. **Conexão Fato-Direito:** Não jogue artigos de lei soltos. Diga: "O fato X viola o artigo Y da Lei Z, gerando o dever de indenizar."

---
### ESTRUTURA DA PEÇA (Output Esperado)

## [CABEÇALHO COMPLETO]
(Endereçamento correto com espaçamento)

## [QUALIFICAÇÃO]
(Qualificação completa das partes com placeholders visíveis para dados faltantes)

## I. DA GRATUIDADE DE JUSTIÇA (Opcional - Avaliar pertinência)
(Se o cliente for pessoa física e não houver indício de riqueza, peça. Caso contrário, ignore.)

## II. DOS FATOS (A Narrativa Persuasiva)
(Conte a história de forma que o juiz sinta empatia pelo Autor. Use cronologia clara. CITE AS PROVAS AQUI.)

## III. DO DIREITO (O Mérito)
(Divida em tópicos claros. Use a jurisprudência fornecida para mostrar que os tribunais estão conosco.)

## IV. DA TUTELA DE URGÊNCIA (Se houver *periculum in mora*)
(Verifique se há risco imediato na descrição. Se sim, peça liminar com força.)

## V. DOS PEDIDOS
(Lista numerada e exaustiva. Inclua: Citação, Procedência Total, Honorários de 20%, Provas, Valor da Causa.)

## [FECHO]
(Local, Data e Assinatura)`;

    try {
      const content = await this.generateText(prompt);
      console.log('✅ Petição inicial gerada');
      return content;
    } catch (error) {
      console.error('❌ Erro ao gerar petição:', error);
      throw error;
    }
  }

  // ============================================
  // GERAR MEMORIAL
  // ============================================
  async generateMemorial(caseData: CaseData, userData: UserData): Promise<string> {
    console.log('📚 Gerando memorial com Gemini...');

    const jurisprudences = caseData.jurisprudence || caseData.jurisprudences || [];
    if (jurisprudences.length === 0) {
      throw new Error('É necessário ter jurisprudências salvas para gerar memoriais');
    }

    const jurisprudenciasCompletas = jurisprudences.map((j: any, i: number) => `
### JURISPRUDÊNCIA ${i + 1}

**Tribunal:** ${j.court}
**Número:** ${j.number}
**Data:** ${j.date}

**EMENTA:**
${j.ementa || j.summary}

**Notas:**
${j.notes || 'Sem anotações'}

**Relevância:** ${j.relevance}%

---
`).join('\n');

    const prompt = `Você é um advogado brasileiro especializado em memoriais e sustentação oral.
Sua função é redigir MEMORIAIS convincentes, focados na análise jurisprudencial e no convencimento do juiz.

=== DADOS DO PROCESSO ===
NUMERO: ${caseData.caseNumber || 'Não informado'}
AUTOR: ${caseData.clientName}
RÉU: ${caseData.opposingParty || 'Não informado'}
TIPO: ${caseData.caseType}
TRIBUNAL: ${caseData.court || 'Competente'}

=== SÍNTESE DO CASO ===
${caseData.description || 'Conforme autos'}

=== JURISPRUDÊNCIA VINCULADA (ESSENCIAL) ===
${jurisprudenciasCompletas}

=== DADOS DO ADVOGADO ===
${userData.name} - OAB ${userData.oab}/${userData.oabState}

=== INSTRUÇÕES DE REDAÇÃO ===
1. FOCO: O memorial deve ser breve, direto e focado na *aplicação dos precedentes* ao caso concreto.
2. USO DE JURISPRUDÊNCIA:
   - Para CADA jurisprudência listada acima, você deve explicar POR QUE ela se aplica a este caso.
   - Cite o tribunal e o número do processo.
   - Use o formato: "O precedente do ${caseData.court || 'Tribunal'}, no processo [número], se amolda perfeitamente ao caso pois..."
3. ESTRUTURA:
   - Endereçamento
   - I - SÍNTESE PROCESSUAL (Breve relato)
   - II - DA ANÁLISE JURISPRUDENCIAL (O coração da peça. Conecte cada julgado aos fatos do caso)
   - III - CONCLUSÃO E PEDIDOS
   - FECHO (Local, Data, Advogado)
   - Bloco Final "JURISPRUDÊNCIA CITADA"

=== PADRÃO ===
- Linguagem persuasiva e culta.
- Markdown.
- Destaque os pontos-chave em negrito.`;

    try {
      const content = await this.generateText(prompt);
      console.log('✅ Memorial gerado');
      return content;
    } catch (error) {
      console.error('❌ Erro ao gerar memorial:', error);
      throw error;
    }
  }

  // ============================================
  // GERAR CONTESTAÇÃO
  // ============================================
  async generateContestacao(caseData: CaseData, userData: UserData, additionalInfo?: string, evidenceDocuments?: any[]): Promise<string> {
    console.log('🛡️ Gerando contestação com Gemini...');

    const provasTexto = this.formatEvidence(evidenceDocuments);

    const prompt = `ATUE COMO UM ESPECIALISTA EM DEFESA CÍVEL E ESTRATÉGIA PROCESSUAL.
O cliente está sendo processado e precisamos de uma **CONTESTAÇÃO** que blinde a defesa e desconstrua a tese do autor.

---
### DADOS DO PROCESSO (O INIMIGO)
- **Ação:** ${caseData.caseType}
- **Autor (Adversário):** ${caseData.opposingParty || '[QUALIFICAR AUTOR]'}
- **Réu (Nosso Cliente):** ${caseData.clientName}
- **O que alegam:** "${caseData.description || 'Analise o contexto para deduzir a alegação padrão desta ação.'}"

### NOSSA PROVA (O ESCUDO)
${provasTexto}

### ESTRATÉGIA DEFINIDA PELO ADVOGADO (COMANDO)
"${additionalInfo || 'Seguir defesa padrão: Preliminares processuais + Mérito (Ausência de culpa/dano).'}"

### JURISPRUDÊNCIA DE APOIO
${(caseData.jurisprudence || caseData.jurisprudences || []).length > 0
        ? (caseData.jurisprudence || caseData.jurisprudences || []).map((j: any, i: number) => `> JURISPRUDÊNCIA ${i + 1}: ${j.ementa || j.summary}`).join('\n')
        : 'Sem jurisprudência específica. Use princípios gerais.'}

---
### DIRETRIZES DE EXECUÇÃO
1. **PRELIMINARES (CRÍTICO):** Antes de entrar no mérito, você DEVE procurar "vícios processuais". Ilegitimidade de parte? Incompetência? Prescrição? Se houver qualquer chance, ARGUA.
2. **IMPUGNAÇÃO ESPECÍFICA:** Pelo princípio da eventualidade, conteste TUDO. Não deixe nenhum fato do autor sem resposta, sob pena de confissão.
3. **TOM:** Firme, incrédulo com as alegações do autor, técnico.
4. **PLACEHOLDERS:** Use **[DADO PENDENTE]** onde faltar informação.

---
### ESTRUTURA DA PEÇA

## [ENDEREÇAMENTO]

## [PREÂMBULO / QUALIFICAÇÃO]

## I. TEMPESTIVIDADE
(Afirme que a contestação é tempestiva).

## II. RESUMO DA INICIAL (A Versão Deles)
(Resuma brevemente o que o autor pede, destacando a fragilidade.)

## III. DAS PRELIMINARES DE MÉRITO (O Bloqueio)
(Arguir qualquer vício processual cabível para extinguir o processo sem resolução do mérito.)

## IV. DO MÉRITO (A Verdade)
(Apresente a versão dos fatos trazida pelo Réu. Cite as provas aqui: **(Doc. X)**.)
(Rebata juridicamente cada ponto. Use a jurisprudência para mostrar que o pedido não tem base.)

## V. DA IMPUGNAÇÃO AOS DANOS E VALORES
(Mesmo que devam algo, impugne os valores excessivos. Diga que não há prova da extensão do dano.)

## VI. DOS PEDIDOS
(Pedir improcedência total. Protestar por todas as provas. Condenação em sucumbência.)

## [FECHO]
Local, Data.
${userData.name}
OAB ${userData.oab}/${userData.oabState}`;

    try {
      const content = await this.generateText(prompt);
      console.log('✅ Contestação gerada');
      return content;
    } catch (error) {
      console.error('❌ Erro ao gerar contestação:', error);
      throw error;
    }
  }

  // ============================================
  // GERAR DOCUMENTO GENÉRICO
  // ============================================
  async generateGenericDocument(
    caseData: CaseData,
    userData: UserData,
    documentType: string,
    additionalInfo?: string,
    evidenceDocuments?: any[]
  ): Promise<string> {
    console.log(`📄 Gerando ${documentType} com Gemini...`);

    const typeDescriptions: Record<string, string> = {
      'replica': 'Réplica à contestação apresentada pelo réu',
      'recurso_apelacao': 'Recurso de Apelação contra sentença',
      'recurso_agravo': 'Agravo de Instrumento contra decisão interlocutória',
      'embargos_declaracao': 'Embargos de Declaração para esclarecer obscuridade ou omissão',
      'peticao_intermediaria': 'Petição intermediária no curso do processo',
    };

    const typeDescription = typeDescriptions[documentType] || documentType.replace('_', ' ');
    const provasTexto = this.formatEvidence(evidenceDocuments);

    const prompt = `Você é um advogado sênior de excelência.
Sua tarefa é redigir uma peça processual do tipo: **${typeDescription}**.

=== DADOS DO PROCESSO ===
${Object.entries(userData).map(([k, v]) => `${k}: ${v}`).join('\n')}
TÍTULO: ${caseData.title}
TIPO DE AÇÃO: ${caseData.caseType}
CLIENTE: ${caseData.clientName}
ADVERSÁRIO: ${caseData.opposingParty || 'Não informado'}
TRIBUNAL: ${caseData.court || 'Não informado'}
DESCRIÇÃO: ${caseData.description}

=== ACERVO PROBATÓRIO ===
${provasTexto}

=== INSTRUÇÕES ESTRATÉGICAS (${additionalInfo ? 'IMPORTANTE' : 'Padronizadas'}) ===
${additionalInfo || 'Siga o padrão formal para este tipo de peça.'}

=== JURISPRUDÊNCIA ===
${(caseData.jurisprudence || caseData.jurisprudences || []).map((j: any) => `- ${j.ementa || j.summary}`).join('\n')}

=== ESTRUTURA EXIGIDA ===
1. Estruture a peça estritamente conforme o CPC/2015 para **${documentType}**.
2. **CITAÇÃO DE PROVAS**: Use **[Doc. Nº - Nome]** para fundamentar fatos.
3. **TOM**: Formal, direto, persuasivo.
4. **FORMATAÇÃO**: Use Markdown (Títulos ##, Negritos **texto**).

Gere a peça completa, do endereçamento ao fecho.`;

    try {
      const content = await this.generateText(prompt);
      console.log(`✅ ${documentType} gerado`);
      return content;
    } catch (error) {
      console.error(`❌ Erro ao gerar ${documentType}:`, error);
      throw error;
    }
  }
}

export default new DocumentGenerationService();